using System.Globalization;
using System.Text.RegularExpressions;
using Gurtundaa.Application.Assistant;
using Gurtundaa.Application.Grocery;
using Gurtundaa.Application.Health;
using Gurtundaa.Application.Milk;
using Gurtundaa.Application.Reminders;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Infrastructure.Assistant;

/// <summary>
/// Rule-based (no LLM) natural-language command parser. Deliberately regex/keyword driven rather
/// than calling out to an AI model — it's free, instant, and works offline; an LLM fallback for
/// phrasings these patterns miss is a planned follow-up, not wired in yet.
/// </summary>
public partial class AssistantService(
    IMilkPauseService milkPauses,
    IMilkSubscriptionService milkSubscription,
    IMilkExtraRequestService milkExtraRequests,
    IMilkDeliveryService milkDelivery,
    IReminderService reminders,
    IHouseholdMemberService householdMembers,
    IGroceryService grocery,
    TimeProvider clock) : IAssistantService
{
    private static readonly string[] Weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    public async Task<AssistantReplyDto> ProcessAsync(AssistantCommandRequest request, CancellationToken ct)
    {
        var text = request.Text.Trim();

        return await TryPauseMilk(text, ct)
            ?? await TryMilkPauseStatus(text, ct)
            ?? await TryListPausedDays(text, ct)
            ?? await TryRemoveMilkPause(text, ct)
            ?? await TryListExtraMilkDays(text, ct)
            ?? await TryAddExtraMilk(text, ct)
            ?? await TryMarkMilkMissed(text, ct)
            ?? await TryListMissedDays(text, ct)
            ?? await TryMilkSchedule(text, ct)
            ?? await TryMilkBill(text, ct)
            ?? await TryCreateReminder(text, ct)
            ?? await TryAddGroceryItems(text, ct)
            ?? await TryTodaysActivities(text, ct)
            ?? Unrecognized();
    }

    // ---------- "pause milk for 3 days" OR "pause milk from nov 9th to nov 12th" ----------

    // Anchored to the start of the sentence so this only matches an imperative command ("pause
    // milk...", "pause tomorrow milk...") and never a question about pause status ("did you pause
    // milk?", "is milk paused?") or a removal request ("remove the paused milk...") — those start
    // with a different word and are handled by their own intents.
    [GeneratedRegex(@"^pause\b.*\bmilk\b", RegexOptions.IgnoreCase)]
    private static partial Regex PauseMilkIntentPattern();

    [GeneratedRegex(@"from\s+(?<start>.+?)\s+to\s+(?<end>.+)$", RegexOptions.IgnoreCase)]
    private static partial Regex DateRangeClausePattern();

    [GeneratedRegex(@"for\s+(?:the\s+next\s+)?(?<days>\d+)\s+days?", RegexOptions.IgnoreCase)]
    private static partial Regex DayCountClausePattern();

    [GeneratedRegex(@"\b(today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b", RegexOptions.IgnoreCase)]
    private static partial Regex RelativeDayWordPattern();

    private async Task<AssistantReplyDto?> TryPauseMilk(string text, CancellationToken ct)
    {
        if (!PauseMilkIntentPattern().IsMatch(text))
        {
            return null;
        }

        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        DateOnly startDate, endDate;

        // An explicit date range always wins over a day count — a sentence like "pause milk for
        // 3 days from Nov 9th to Nov 12th" should use the real dates, not quietly fall back to
        // "starting today" just because the day-count clause also happens to be present.
        var rangeMatch = DateRangeClausePattern().Match(text);
        if (rangeMatch.Success
            && ParseNaturalDate(rangeMatch.Groups["start"].Value, today) is { } parsedStart
            && ParseNaturalDate(rangeMatch.Groups["end"].Value, today) is { } parsedEnd)
        {
            startDate = parsedStart;
            endDate = parsedEnd < parsedStart ? parsedStart : parsedEnd;
        }
        else
        {
            var dayCountMatch = DayCountClausePattern().Match(text);
            if (dayCountMatch.Success)
            {
                startDate = today;
                endDate = today.AddDays(Math.Max(1, int.Parse(dayCountMatch.Groups["days"].Value)) - 1);
            }
            else
            {
                // No count or range — "pause milk tomorrow" / "pause tomorrow milk" / "pause milk
                // today" means a single day, not "pause indefinitely" or a request for more info.
                var relativeDayMatch = RelativeDayWordPattern().Match(text);
                if (!relativeDayMatch.Success)
                {
                    return new AssistantReplyDto(
                        "For how long should I pause it? Try \"pause milk for 3 days\", \"pause milk from Nov 9 to Nov 12\", or \"pause milk tomorrow\".",
                        false);
                }

                startDate = endDate = ResolveDayReference(relativeDayMatch.Value, today);
            }
        }

        var totalDays = endDate.DayNumber - startDate.DayNumber + 1;
        await milkPauses.CreateAsync(new SaveMilkPauseRequest(startDate, endDate, "Requested via Assistant"), ct);
        return new AssistantReplyDto(
            $"Done — milk is now paused from {startDate:MMM d} to {endDate:MMM d} ({totalDays} day{(totalDays == 1 ? "" : "s")}). " +
            "It'll resume automatically the day after, no further action needed.",
            true);
    }

    // ---------- natural date phrases: "nov 9th", "november 9", "9th nov" ----------

    private static readonly Dictionary<string, int> MonthNumbers = new(StringComparer.OrdinalIgnoreCase)
    {
        ["jan"] = 1, ["january"] = 1,
        ["feb"] = 2, ["february"] = 2,
        ["mar"] = 3, ["march"] = 3,
        ["apr"] = 4, ["april"] = 4,
        ["may"] = 5,
        ["jun"] = 6, ["june"] = 6,
        ["jul"] = 7, ["july"] = 7,
        ["aug"] = 8, ["august"] = 8,
        ["sep"] = 9, ["sept"] = 9, ["september"] = 9,
        ["oct"] = 10, ["october"] = 10,
        ["nov"] = 11, ["november"] = 11,
        ["dec"] = 12, ["december"] = 12,
    };

    [GeneratedRegex(@"^(?<month>[a-z]+)\.?\s+(?<day>\d{1,2})(?:st|nd|rd|th)?$", RegexOptions.IgnoreCase)]
    private static partial Regex MonthThenDayPattern();

    [GeneratedRegex(@"^(?<day>\d{1,2})(?:st|nd|rd|th)?\s+(?<month>[a-z]+)\.?$", RegexOptions.IgnoreCase)]
    private static partial Regex DayThenMonthPattern();

    private static DateOnly? ParseNaturalDate(string phrase, DateOnly today)
    {
        phrase = phrase.Trim().TrimEnd('?', '.', '!');

        var match = MonthThenDayPattern().Match(phrase);
        if (!match.Success)
        {
            match = DayThenMonthPattern().Match(phrase);
        }
        if (!match.Success
            || !MonthNumbers.TryGetValue(match.Groups["month"].Value, out var month)
            || !int.TryParse(match.Groups["day"].Value, out var day))
        {
            return null;
        }

        DateOnly candidate;
        try
        {
            candidate = new DateOnly(today.Year, month, day);
        }
        catch (ArgumentOutOfRangeException)
        {
            return null;
        }

        // A date phrase that's clearly "in the past" (e.g. "Nov 9" asked about in late December)
        // almost certainly means next year, not eleven months ago.
        if (candidate < today.AddDays(-14))
        {
            candidate = candidate.AddYears(1);
        }

        return candidate;
    }

    // ---------- "did you pause milk?" / "is milk paused?" — a real check against today's actual
    // pause state, not a replay of the last chat message, so the answer stays correct even if
    // asked much later or after something else changed it. ----------

    [GeneratedRegex(@"(?:is|was)\s+(?:the\s+)?milk(?:\s+delivery)?\s+paused|did\s+you\s+pause\s+(?:the\s+)?milk", RegexOptions.IgnoreCase)]
    private static partial Regex MilkPauseStatusPattern();

    private async Task<AssistantReplyDto?> TryMilkPauseStatus(string text, CancellationToken ct)
    {
        if (!MilkPauseStatusPattern().IsMatch(text))
        {
            return null;
        }

        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        var pauses = await milkPauses.ListAsync(false, ct);
        var active = pauses.FirstOrDefault(p => p.StartDate <= today && p.EndDate >= today);

        return active is not null
            ? new AssistantReplyDto($"Yes — milk is paused from {active.StartDate:MMM d} to {active.EndDate:MMM d}.", true)
            : new AssistantReplyDto("No, milk delivery isn't paused right now.", true);
    }

    // ---------- "what are the paused days?" / "list the paused days for October" ----------

    [GeneratedRegex(@"\b(what|which|list|show)\b.*\bpause|paused\s+days?", RegexOptions.IgnoreCase)]
    private static partial Regex PausedDaysQueryPattern();

    private async Task<AssistantReplyDto?> TryListPausedDays(string text, CancellationToken ct)
    {
        if (!PausedDaysQueryPattern().IsMatch(text))
        {
            return null;
        }

        var (rangeStart, rangeEnd, monthLabel) = ResolveMonthRange(text);
        var pauses = await milkPauses.ListAsync(false, ct);
        var overlapping = pauses.Where(p => p.StartDate <= rangeEnd && p.EndDate >= rangeStart).OrderBy(p => p.StartDate).ToList();

        if (overlapping.Count == 0)
        {
            return new AssistantReplyDto($"No paused days found for {monthLabel}.", true);
        }

        var lines = overlapping.Select(p => $"• {p.StartDate:MMM d} – {p.EndDate:MMM d}" + (string.IsNullOrWhiteSpace(p.Reason) ? "" : $" ({p.Reason})"));
        return new AssistantReplyDto($"Paused days in {monthLabel}:\n{string.Join('\n', lines)}", true);
    }

    // ---------- "remove the paused milk related days in october" / "cancel milk pause in nov" ----------

    [GeneratedRegex(@"\b(remove|cancel|delete|clear|unpause|resume)\b", RegexOptions.IgnoreCase)]
    private static partial Regex RemovalVerbPattern();

    [GeneratedRegex(
        @"\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)\b",
        RegexOptions.IgnoreCase)]
    private static partial Regex MonthNamePattern();

    /// <summary>
    /// A named month ("in October") always means *this* calendar year — these queries are about
    /// reviewing/cleaning up a period that's already happened or in progress, not scheduling ahead.
    /// No month mentioned at all defaults to the current month.
    /// </summary>
    private (DateOnly Start, DateOnly End, string Label) ResolveMonthRange(string text)
    {
        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        var monthMatch = MonthNamePattern().Match(text);
        var (year, month) = monthMatch.Success && MonthNumbers.TryGetValue(monthMatch.Value, out var parsedMonth)
            ? (today.Year, parsedMonth)
            : (today.Year, today.Month);

        var start = new DateOnly(year, month, 1);
        var end = new DateOnly(year, month, DateTime.DaysInMonth(year, month));
        return (start, end, start.ToString("MMMM", CultureInfo.InvariantCulture));
    }

    private async Task<AssistantReplyDto?> TryRemoveMilkPause(string text, CancellationToken ct)
    {
        var lower = text.ToLowerInvariant();
        var mentionsMilkPause = lower.Contains("milk") && (lower.Contains("pause") || lower.Contains("paused"));
        if (!mentionsMilkPause || !RemovalVerbPattern().IsMatch(text))
        {
            return null;
        }

        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);

        DateOnly rangeStart, rangeEnd;
        string scopeLabel;
        // Removing pauses by month name is about cleaning up existing records (past or current),
        // so it always targets *this* calendar year — unlike scheduling a new pause, where a
        // past-looking date is assumed to mean next year instead. ResolveMonthRange already does that.
        if (MonthNamePattern().IsMatch(text))
        {
            (rangeStart, rangeEnd, scopeLabel) = ResolveMonthRange(text);
        }
        else
        {
            // No month given — fall back to just today's pause, same as the Milk page's "Resume Now".
            rangeStart = rangeEnd = today;
            scopeLabel = "today";
        }

        var pauses = await milkPauses.ListAsync(false, ct);
        var overlapping = pauses.Where(p => p.StartDate <= rangeEnd && p.EndDate >= rangeStart).ToList();
        if (overlapping.Count == 0)
        {
            return new AssistantReplyDto($"No milk pauses found for {scopeLabel}.", true);
        }

        foreach (var pause in overlapping)
        {
            await milkPauses.DeleteAsync(pause.Id, ct);
        }

        var ranges = string.Join(", ", overlapping.Select(p => $"{p.StartDate:MMM d}–{p.EndDate:MMM d}"));
        return new AssistantReplyDto(
            $"Done — removed {overlapping.Count} milk pause{(overlapping.Count == 1 ? "" : "s")} that overlapped {scopeLabel} ({ranges}).",
            true);
    }

    // ---------- "what are the extra milk requested days?" / "list extra milk requests for October" ----------

    [GeneratedRegex(@"\b(what|which|list|show|when)\b.*extra\s+milk|extra\s+milk.*\b(days?|requests?)\b", RegexOptions.IgnoreCase)]
    private static partial Regex ExtraMilkQueryPattern();

    private async Task<AssistantReplyDto?> TryListExtraMilkDays(string text, CancellationToken ct)
    {
        if (!ExtraMilkQueryPattern().IsMatch(text))
        {
            return null;
        }

        var (rangeStart, rangeEnd, monthLabel) = ResolveMonthRange(text);
        var all = await milkExtraRequests.ListAsync(false, ct);
        var inMonth = all.Where(e => e.Date >= rangeStart && e.Date <= rangeEnd).OrderBy(e => e.Date).ToList();

        if (inMonth.Count == 0)
        {
            return new AssistantReplyDto($"No extra milk requests found for {monthLabel}.", true);
        }

        var lines = inMonth.Select(e => $"• {e.Date:MMM d} — +{e.QuantityLtr:0.##} Ltr ({e.Slot})");
        return new AssistantReplyDto($"Extra milk requested in {monthLabel}:\n{string.Join('\n', lines)}", true);
    }

    // ---------- "extra milk this weekend saturday 1 litre and sunday 2 litres" ----------

    [GeneratedRegex(@"extra\s+milk", RegexOptions.IgnoreCase)]
    private static partial Regex ExtraMilkIntentPattern();

    [GeneratedRegex(
        @"(?<day>today|tomorrow|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\D{0,15}?(?<qty>\d+(?:\.\d+)?)\s*(?:litres?|liters?|ltrs?|l)\b",
        RegexOptions.IgnoreCase)]
    private static partial Regex ExtraMilkDayQuantityPattern();

    private async Task<AssistantReplyDto?> TryAddExtraMilk(string text, CancellationToken ct)
    {
        if (!ExtraMilkIntentPattern().IsMatch(text))
        {
            return null;
        }

        var matches = ExtraMilkDayQuantityPattern().Matches(text);
        if (matches.Count == 0)
        {
            return new AssistantReplyDto(
                "Which day(s) and how much extra? Try \"extra milk Saturday 1 litre and Sunday 2 litres\".",
                false);
        }

        // No slot is specified in sentences like this, so it defaults to the morning delivery —
        // the reply says so explicitly rather than silently picking one.
        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        var created = new List<string>();
        foreach (Match match in matches)
        {
            var date = ResolveDayReference(match.Groups["day"].Value, today);
            var qty = decimal.Parse(match.Groups["qty"].Value, CultureInfo.InvariantCulture);
            await milkExtraRequests.CreateAsync(new SaveMilkExtraRequestRequest(date, MilkSlot.Morning, qty, "Requested via Assistant"), ct);
            created.Add($"{date:MMM d} +{qty:0.##} Ltr");
        }

        return new AssistantReplyDto($"Done — added extra milk: {string.Join(", ", created)} (morning slot).", true);
    }

    private static DateOnly ResolveDayReference(string word, DateOnly today)
    {
        word = word.ToLowerInvariant();
        if (word == "today") return today;
        if (word == "tomorrow") return today.AddDays(1);

        var target = (DayOfWeek)Array.IndexOf(Weekdays, word);
        var daysAhead = ((int)target - (int)today.DayOfWeek + 7) % 7;
        return today.AddDays(daysAhead);
    }

    // ---------- "today milk not delivered" / "milk was missed today" — marks a specific day,
    // as opposed to asking to list missed days (that's a question, this is a statement). ----------

    [GeneratedRegex(@"milk.*(?:not\s+delivered|\bmissed\b)|(?:not\s+delivered|\bmissed\b).*milk", RegexOptions.IgnoreCase)]
    private static partial Regex MilkMissedStatementPattern();

    [GeneratedRegex(@"\b(what|which|list|show)\b|\bdays?\b", RegexOptions.IgnoreCase)]
    private static partial Regex QueryIndicatorPattern();

    private async Task<AssistantReplyDto?> TryMarkMilkMissed(string text, CancellationToken ct)
    {
        if (!MilkMissedStatementPattern().IsMatch(text) || QueryIndicatorPattern().IsMatch(text))
        {
            return null;
        }

        var subscription = await milkSubscription.GetAsync(ct);
        if (subscription is null)
        {
            return new AssistantReplyDto("You don't have a milk subscription set up yet.", true);
        }

        var slots = new List<MilkSlot>();
        if (subscription.MorningEnabled) slots.Add(MilkSlot.Morning);
        if (subscription.EveningEnabled) slots.Add(MilkSlot.Evening);
        if (slots.Count == 0)
        {
            return new AssistantReplyDto("Your milk subscription doesn't have any delivery slots enabled.", true);
        }

        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);
        var lower = text.ToLowerInvariant();
        var date = lower.Contains("tomorrow") ? today.AddDays(1) : lower.Contains("yesterday") ? today.AddDays(-1) : today;

        foreach (var slot in slots)
        {
            await milkDelivery.SetOverrideAsync(date, new SetMilkDeliveryOverrideRequest(slot, MilkDeliveryStatus.Missed, null, "Requested via Assistant"), ct);
        }

        var dayLabel = date == today ? "today" : date == today.AddDays(1) ? "tomorrow" : date == today.AddDays(-1) ? "yesterday" : date.ToString("MMM d");
        return new AssistantReplyDto($"Done — marked milk as not delivered for {dayLabel} ({string.Join(" & ", slots)}).", true);
    }

    // ---------- "what are those milk not delivered?" / "which days was milk missed?" ----------

    private async Task<AssistantReplyDto?> TryListMissedDays(string text, CancellationToken ct)
    {
        if (!MilkMissedStatementPattern().IsMatch(text) || !QueryIndicatorPattern().IsMatch(text))
        {
            return null;
        }

        if (await milkSubscription.GetAsync(ct) is null)
        {
            return new AssistantReplyDto("You don't have a milk subscription set up yet.", true);
        }

        var (rangeStart, _, monthLabel) = ResolveMonthRange(text);
        var result = await milkDelivery.GetMonthAsync(rangeStart.Year, rangeStart.Month, ct);
        var missedDays = result.Days.Where(d => d.Status == MilkCalendarStatus.Missed).OrderBy(d => d.Date).ToList();

        if (missedDays.Count == 0)
        {
            return new AssistantReplyDto($"No missed milk days in {monthLabel} — all good!", true);
        }

        var lines = missedDays.Select(d => $"• {d.Date:MMM d}");
        return new AssistantReplyDto($"Missed milk days in {monthLabel}:\n{string.Join('\n', lines)}", true);
    }

    // ---------- "add milk delivery every morning at 6 AM" (and evening equivalent) ----------

    [GeneratedRegex(@"(?:add|start)\s+milk\s+delivery\s+every\s+(morning|evening)(?:\s+at\s+(.+))?", RegexOptions.IgnoreCase)]
    private static partial Regex MilkSchedulePattern();

    private async Task<AssistantReplyDto?> TryMilkSchedule(string text, CancellationToken ct)
    {
        var match = MilkSchedulePattern().Match(text);
        if (!match.Success)
        {
            return null;
        }

        var subscription = await milkSubscription.GetAsync(ct);
        if (subscription is null)
        {
            return new AssistantReplyDto(
                "You don't have a milk subscription set up yet — I need a quantity and rate per litre first, which isn't something you told me. " +
                "Please set it up once in the Milk section, and I can adjust the schedule for you after that.",
                true);
        }

        var isMorning = string.Equals(match.Groups[1].Value, "morning", StringComparison.OrdinalIgnoreCase);
        var time = ParseTimeOfDay(match.Groups[2].Success ? match.Groups[2].Value : null) ?? (isMorning ? new TimeOnly(6, 0) : new TimeOnly(18, 0));

        var updated = new SaveMilkSubscriptionRequest(
            subscription.ContactId,
            subscription.IsSelfCollected,
            subscription.StartDate,
            isMorning || subscription.MorningEnabled,
            isMorning && subscription.MorningQuantityLtr == 0 ? 1 : subscription.MorningQuantityLtr,
            isMorning ? time : subscription.MorningWindowStart,
            isMorning ? null : subscription.MorningWindowEnd,
            !isMorning || subscription.EveningEnabled,
            !isMorning && subscription.EveningQuantityLtr == 0 ? 1 : subscription.EveningQuantityLtr,
            !isMorning ? time : subscription.EveningWindowStart,
            !isMorning ? null : subscription.EveningWindowEnd,
            subscription.RatePerLtr,
            subscription.SettlementCycle);

        await milkSubscription.SaveAsync(updated, ct);
        return new AssistantReplyDto($"Done — milk delivery is set for {(isMorning ? "mornings" : "evenings")} at {time:h:mm tt}.", true);
    }

    // ---------- "what was the milk bill for this month?" / "how much do I owe for milk?" ----------

    [GeneratedRegex(@"milk\s+bill|bill\s+for\s+(?:the\s+)?milk|(?:owe|due)\s+for\s+milk", RegexOptions.IgnoreCase)]
    private static partial Regex MilkBillPattern();

    private async Task<AssistantReplyDto?> TryMilkBill(string text, CancellationToken ct)
    {
        if (!MilkBillPattern().IsMatch(text))
        {
            return null;
        }

        if (await milkSubscription.GetAsync(ct) is null)
        {
            return new AssistantReplyDto("You don't have a milk subscription set up yet, so there's no bill to show. Set it up once in the Milk section.", true);
        }

        var (rangeStart, _, monthLabel) = ResolveMonthRange(text);
        var result = await milkDelivery.GetMonthAsync(rangeStart.Year, rangeStart.Month, ct);
        var s = result.Summary;

        if (s.Delivered == 0 && s.Paused == 0 && s.Missed == 0 && s.TotalAmount == 0)
        {
            return new AssistantReplyDto($"No milk activity recorded for {monthLabel} yet.", true);
        }

        return new AssistantReplyDto(
            $"Your milk bill for {monthLabel} is ₹{s.TotalAmount:0.##} so far " +
            $"({s.Delivered} delivered, {s.Paused} paused, {s.Missed} missed) — {(s.IsPaid ? "marked Paid" : "still Pending")}.",
            true);
    }

    // ---------- "remind mother to take her medicine after lunch" / "...every Sunday" ----------

    [GeneratedRegex(@"^remind\s+(?<who>.+?)\s+to\s+(?<rest>.+)$", RegexOptions.IgnoreCase)]
    private static partial Regex ReminderPattern();

    [GeneratedRegex(@"\bevery\s+(day|daily|morning|evening|night|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b", RegexOptions.IgnoreCase)]
    private static partial Regex RecurrenceClausePattern();

    [GeneratedRegex(@"\b(?:at|after)\s+(.+)$", RegexOptions.IgnoreCase)]
    private static partial Regex TimeClausePattern();

    private async Task<AssistantReplyDto?> TryCreateReminder(string text, CancellationToken ct)
    {
        var match = ReminderPattern().Match(text);
        if (!match.Success)
        {
            return null;
        }

        var who = match.Groups["who"].Value.Trim();
        var rest = match.Groups["rest"].Value.Trim();

        var recurrence = ReminderRecurrence.None;
        DayOfWeek? recurrenceDay = null;
        var recurrenceMatch = RecurrenceClausePattern().Match(rest);
        if (recurrenceMatch.Success)
        {
            rest = rest.Remove(recurrenceMatch.Index, recurrenceMatch.Length).Trim();
            var word = recurrenceMatch.Groups[1].Value.ToLowerInvariant();
            var weekdayIndex = Array.IndexOf(Weekdays, word);
            if (weekdayIndex >= 0)
            {
                recurrence = ReminderRecurrence.Weekly;
                recurrenceDay = (DayOfWeek)weekdayIndex;
            }
            else
            {
                recurrence = ReminderRecurrence.Daily;
            }
        }

        TimeOnly? time = null;
        var timeMatch = TimeClausePattern().Match(rest);
        if (timeMatch.Success)
        {
            time = ParseTimeOfDay(timeMatch.Groups[1].Value);
            if (time is not null)
            {
                rest = rest.Remove(timeMatch.Index, timeMatch.Length).Trim();
            }
        }

        var title = rest.Length > 0 ? char.ToUpperInvariant(rest[0]) + rest[1..] : "Reminder";
        var effectiveTime = time ?? new TimeOnly(9, 0);

        var member = await ResolveMember(who, ct);
        var now = clock.GetUtcNow();
        var localNow = now.LocalDateTime;
        var dueDate = DateOnly.FromDateTime(localNow);

        if (recurrence == ReminderRecurrence.Weekly && recurrenceDay is { } day)
        {
            var daysAhead = ((int)day - (int)dueDate.DayOfWeek + 7) % 7;
            dueDate = dueDate.AddDays(daysAhead == 0 ? 7 : daysAhead);
        }
        else if (new DateTime(dueDate.Year, dueDate.Month, dueDate.Day, effectiveTime.Hour, effectiveTime.Minute, 0) <= localNow)
        {
            // That time has already passed today — the obviously-intended occurrence is tomorrow,
            // not "fire it immediately" or "silently skip today".
            dueDate = dueDate.AddDays(1);
        }

        var dueAt = new DateTimeOffset(dueDate.Year, dueDate.Month, dueDate.Day, effectiveTime.Hour, effectiveTime.Minute, 0, now.Offset);

        await reminders.CreateAsync(
            new SaveReminderRequest(title, null, dueAt, ReminderPriority.Normal, member?.Id, recurrence, recurrenceDay), ct);

        var who2 = member is not null ? member.Name : "you";
        var recurrenceLabel = recurrence switch
        {
            ReminderRecurrence.Daily => " every day",
            ReminderRecurrence.Weekly => $" every {recurrenceDay}",
            _ => "",
        };
        return new AssistantReplyDto($"Done — reminder set for {who2}: \"{title}\" at {effectiveTime:h:mm tt}{recurrenceLabel}.", true);
    }

    // ---------- "add vegetables, milk to our grocery list every Sunday" ----------

    [GeneratedRegex(@"^add\s+(?<items>.+?)\s+to\s+(?:our\s+|the\s+)?grocery\s+list(?:\s+every\s+(?<day>sunday|monday|tuesday|wednesday|thursday|friday|saturday))?$", RegexOptions.IgnoreCase)]
    private static partial Regex GroceryPattern();

    private async Task<AssistantReplyDto?> TryAddGroceryItems(string text, CancellationToken ct)
    {
        var match = GroceryPattern().Match(text);
        if (!match.Success)
        {
            return null;
        }

        DayOfWeek? recurringWeekday = match.Groups["day"].Success
            ? (DayOfWeek)Array.IndexOf(Weekdays, match.Groups["day"].Value.ToLowerInvariant())
            : null;

        var names = Regex.Split(match.Groups["items"].Value, @"\s*,\s*|\s+and\s+", RegexOptions.IgnoreCase)
            .Select(n => n.Trim())
            .Where(n => n.Length > 0)
            .ToList();

        foreach (var name in names)
        {
            await grocery.CreateAsync(new SaveGroceryItemRequest(name, recurringWeekday), ct);
        }

        var recurrenceLabel = recurringWeekday is { } w ? $" (every {w})" : "";
        return new AssistantReplyDto($"Done — added {string.Join(", ", names)} to the grocery list{recurrenceLabel}.", true);
    }

    // ---------- "what are today's activities for my father?" ----------

    [GeneratedRegex(@"what(?:'s|\s+is|\s+are)\s+today'?s\s+activities\s+for\s+(?<who>.+?)\??$", RegexOptions.IgnoreCase)]
    private static partial Regex TodaysActivitiesPattern();

    private async Task<AssistantReplyDto?> TryTodaysActivities(string text, CancellationToken ct)
    {
        var match = TodaysActivitiesPattern().Match(text);
        if (!match.Success)
        {
            return null;
        }

        var member = await ResolveMember(match.Groups["who"].Value.Trim(), ct);
        var today = DateOnly.FromDateTime(clock.GetUtcNow().LocalDateTime);

        var all = await reminders.ListAsync(ReminderFilter.All, ct);
        var todays = all
            .Where(r => !r.IsDone && r.DueAt is not null && DateOnly.FromDateTime(r.DueAt.Value.LocalDateTime) == today)
            .Where(r => member is null ? r.MemberId is null : r.MemberId == member.Id)
            .OrderBy(r => r.DueAt)
            .ToList();

        var who = member?.Name ?? "you";
        if (todays.Count == 0)
        {
            return new AssistantReplyDto($"Nothing scheduled for {who} today.", true);
        }

        var lines = todays.Select(r => $"• {r.DueAt!.Value.LocalDateTime:h:mm tt} — {r.Title}");
        return new AssistantReplyDto($"Today's activities for {who}:\n{string.Join('\n', lines)}", true);
    }

    // ---------- shared helpers ----------

    private async Task<HouseholdMemberDto?> ResolveMember(string who, CancellationToken ct)
    {
        if (who.Equals("me", StringComparison.OrdinalIgnoreCase) || who.Equals("myself", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var members = await householdMembers.ListAsync(ct);
        // "my father"/"my mother" -> match against the stored relation; otherwise match by first name.
        var cleaned = Regex.Replace(who, @"^(my|our)\s+", "", RegexOptions.IgnoreCase).Trim();
        return members.FirstOrDefault(m => m.Relation.Equals(cleaned, StringComparison.OrdinalIgnoreCase))
            ?? members.FirstOrDefault(m => m.Name.Equals(cleaned, StringComparison.OrdinalIgnoreCase))
            ?? members.FirstOrDefault(m => m.Name.Contains(cleaned, StringComparison.OrdinalIgnoreCase));
    }

    [GeneratedRegex(@"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", RegexOptions.IgnoreCase)]
    private static partial Regex ClockTimePattern();

    /// <summary>Parses "6 am", "6:30pm", or a handful of everyday phrases like "after lunch" into a time of day. Null if nothing recognizable.</summary>
    private static TimeOnly? ParseTimeOfDay(string? phrase)
    {
        if (string.IsNullOrWhiteSpace(phrase))
        {
            return null;
        }

        var match = ClockTimePattern().Match(phrase);
        if (match.Success)
        {
            var hour = int.Parse(match.Groups[1].Value);
            var minute = match.Groups[2].Success ? int.Parse(match.Groups[2].Value) : 0;
            if (match.Groups[3].Success)
            {
                var isPm = match.Groups[3].Value.Equals("pm", StringComparison.OrdinalIgnoreCase);
                hour = hour % 12 + (isPm ? 12 : 0);
            }
            if (hour is >= 0 and < 24 && minute is >= 0 and < 60)
            {
                return new TimeOnly(hour, minute);
            }
        }

        var lower = phrase.ToLowerInvariant();
        if (lower.Contains("breakfast")) return new TimeOnly(9, 0);
        if (lower.Contains("lunch")) return new TimeOnly(13, 0);
        if (lower.Contains("dinner")) return new TimeOnly(20, 0);
        if (lower.Contains("morning")) return new TimeOnly(8, 0);
        if (lower.Contains("evening")) return new TimeOnly(18, 0);
        if (lower.Contains("night")) return new TimeOnly(21, 0);
        if (lower.Contains("noon")) return new TimeOnly(12, 0);

        return null;
    }

    private static AssistantReplyDto Unrecognized() => new(
        "I didn't understand that. Try things like: \"pause milk for 3 days\", \"remind mother to take her medicine after lunch\", " +
        "\"add vegetables to our grocery list every Sunday\", or \"what are today's activities for my father?\"",
        false);
}

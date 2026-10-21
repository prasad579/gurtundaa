using Gurtundaa.Application.Common;
using Gurtundaa.Application.Health;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Health;

public class HouseholdMemberService(AppDbContext db, ICurrentUser currentUser, TimeProvider clock) : IHouseholdMemberService
{
    private IQueryable<HouseholdMember> Mine => db.HouseholdMembers.Where(m => m.UserId == currentUser.UserId);

    public async Task<IReadOnlyList<HouseholdMemberDto>> ListAsync(CancellationToken ct) =>
        await Mine.AsNoTracking().OrderBy(m => m.CreatedAt).Select(ToDtoExpression).ToListAsync(ct);

    public async Task<HouseholdMemberDto> CreateAsync(SaveHouseholdMemberRequest request, CancellationToken ct)
    {
        var member = new HouseholdMember { UserId = currentUser.UserId, CreatedAt = clock.GetUtcNow() };
        Apply(member, request);

        db.HouseholdMembers.Add(member);
        await db.SaveChangesAsync(ct);
        return ToDto(member);
    }

    public async Task<HouseholdMemberDto?> UpdateAsync(Guid id, SaveHouseholdMemberRequest request, CancellationToken ct)
    {
        var member = await Mine.SingleOrDefaultAsync(m => m.Id == id, ct);
        if (member is null)
        {
            return null;
        }

        Apply(member, request);
        await db.SaveChangesAsync(ct);
        return ToDto(member);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct)
    {
        // Medicine.MemberId and Prescription.MemberId are both NoAction (not Cascade) — same
        // multi-cascade-path reason as MilkSubscription/LaundryBatch -> ServiceContacts, since
        // AppUser already reaches both directly via their own UserId. Neither makes sense without
        // this member, so delete them outright (DoseLogs cascade from Medicine) rather than nulling
        // the reference. Medicines first: every Prescription for this member only ever has
        // medicines with the same MemberId (PrescriptionService.CreateAsync enforces that), so once
        // they're gone the prescriptions are safe to delete too.
        await db.Medicines.Where(m => m.UserId == currentUser.UserId && m.MemberId == id).ExecuteDeleteAsync(ct);
        await db.Prescriptions.Where(p => p.UserId == currentUser.UserId && p.MemberId == id).ExecuteDeleteAsync(ct);
        return await Mine.Where(m => m.Id == id).ExecuteDeleteAsync(ct) > 0;
    }

    private static void Apply(HouseholdMember member, SaveHouseholdMemberRequest request)
    {
        member.Name = request.Name.Trim();
        member.Relation = request.Relation.Trim();
        member.AvatarEmoji = string.IsNullOrWhiteSpace(request.AvatarEmoji) ? "🧑" : request.AvatarEmoji.Trim();
    }

    private static readonly System.Linq.Expressions.Expression<Func<HouseholdMember, HouseholdMemberDto>> ToDtoExpression =
        m => new HouseholdMemberDto(m.Id, m.Name, m.Relation, m.AvatarEmoji);

    private static HouseholdMemberDto ToDto(HouseholdMember member) => new(member.Id, member.Name, member.Relation, member.AvatarEmoji);
}

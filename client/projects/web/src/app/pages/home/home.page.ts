import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AuthService,
  BRAND,
  PRIORITY_LABELS,
  Reminder,
  ReminderFilter,
  ReminderPriority,
  ReminderStats,
  RemindersApi,
  dueLabel,
  emptyStateLine,
  fromLocalInputValue,
  greeting,
  isOverdue,
  randomCheer,
  toLocalInputValue,
} from '@gurtundaa/shared';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  private readonly api = inject(RemindersApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly brand = BRAND;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly priorities: ReminderPriority[] = ['Chill', 'Normal', 'Urgent'];
  protected readonly filters: { value: ReminderFilter; label: string }[] = [
    { value: 'All', label: 'all' },
    { value: 'Upcoming', label: 'upcoming' },
    { value: 'Overdue', label: 'overdue' },
    { value: 'Done', label: 'done' },
  ];

  protected readonly user = this.auth.user;
  protected readonly hello = computed(() => greeting(this.user()?.displayName));
  protected readonly filter = signal<ReminderFilter>('All');
  protected readonly reminders = signal<Reminder[]>([]);
  protected readonly stats = signal<ReminderStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly toast = signal<string | null>(null);
  protected readonly emptyLine = computed(() => emptyStateLine(this.filter()));

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    dueAt: new FormControl('', { nonNullable: true }),
    priority: new FormControl<ReminderPriority>('Normal', { nonNullable: true }),
  });

  protected readonly dueLabel = dueLabel;
  protected readonly isOverdue = isOverdue;

  private toastTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    void this.refresh();
  }

  protected async setFilter(filter: ReminderFilter): Promise<void> {
    this.filter.set(filter);
    await this.refresh();
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request = {
      title: value.title,
      notes: value.notes || null,
      dueAt: fromLocalInputValue(value.dueAt),
      priority: value.priority,
    };

    this.saving.set(true);
    try {
      const id = this.editingId();
      await firstValueFrom(id ? this.api.update(id, request) : this.api.create(request));
      this.showToast(id ? 'updated ✍️' : "saved. we'll remember 💭");
      this.cancelEdit();
      await this.refresh();
    } catch {
      this.error.set("couldn't save that one, try again?");
    } finally {
      this.saving.set(false);
    }
  }

  protected edit(reminder: Reminder): void {
    this.editingId.set(reminder.id);
    this.form.setValue({
      title: reminder.title,
      notes: reminder.notes ?? '',
      dueAt: toLocalInputValue(reminder.dueAt),
      priority: reminder.priority,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', notes: '', dueAt: '', priority: 'Normal' });
  }

  protected async toggleDone(reminder: Reminder): Promise<void> {
    await firstValueFrom(this.api.setDone(reminder.id, !reminder.isDone));
    if (!reminder.isDone) {
      this.showToast(randomCheer());
    }
    await this.refresh();
  }

  protected async remove(reminder: Reminder): Promise<void> {
    if (!confirm(`delete "${reminder.title}"? no take-backs.`)) {
      return;
    }
    await firstValueFrom(this.api.delete(reminder.id));
    if (this.editingId() === reminder.id) {
      this.cancelEdit();
    }
    this.showToast('gone 🫥');
    await this.refresh();
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }

  private async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [reminders, stats] = await Promise.all([
        firstValueFrom(this.api.list(this.filter())),
        firstValueFrom(this.api.stats()),
      ]);
      this.reminders.set(reminders);
      this.stats.set(stats);
    } catch {
      this.error.set("can't load your reminders rn. is the api running?");
    } finally {
      this.loading.set(false);
    }
  }

  private showToast(message: string): void {
    this.toast.set(message);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2200);
  }
}

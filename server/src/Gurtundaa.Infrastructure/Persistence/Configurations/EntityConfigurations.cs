using Gurtundaa.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gurtundaa.Infrastructure.Persistence.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.Property(u => u.DisplayName).HasMaxLength(100).IsRequired();
    }
}

public class ReminderConfiguration : IEntityTypeConfiguration<Reminder>
{
    public void Configure(EntityTypeBuilder<Reminder> builder)
    {
        builder.ToTable("Reminders");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Title).HasMaxLength(200).IsRequired();
        builder.Property(r => r.Notes).HasMaxLength(2000);
        builder.Property(r => r.Priority).HasConversion<byte>();

        builder.HasOne(r => r.User)
            .WithMany(u => u.Reminders)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Every list query filters by user, then by done/due date.
        builder.HasIndex(r => new { r.UserId, r.IsDone, r.DueAt });
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
        builder.HasIndex(t => t.TokenHash).IsUnique();
        builder.Ignore(t => t.IsActive);

        builder.HasOne(t => t.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class HouseholdProfileConfiguration : IEntityTypeConfiguration<HouseholdProfile>
{
    public void Configure(EntityTypeBuilder<HouseholdProfile> builder)
    {
        builder.ToTable("HouseholdProfiles");
        builder.HasKey(p => p.UserId);
        builder.Property(p => p.AccountType).HasMaxLength(30).IsRequired();
        builder.Property(p => p.City).HasMaxLength(100);
        builder.Property(p => p.EnabledFeatures).HasMaxLength(500).IsRequired();

        builder.HasOne(p => p.User)
            .WithOne()
            .HasForeignKey<HouseholdProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PhoneOtpConfiguration : IEntityTypeConfiguration<PhoneOtp>
{
    public void Configure(EntityTypeBuilder<PhoneOtp> builder)
    {
        builder.ToTable("PhoneOtps");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.PhoneNumber).HasMaxLength(20).IsRequired();
        builder.Property(o => o.CodeHash).HasMaxLength(64).IsRequired();

        // Looking up the newest active code for a phone number is the hot path.
        builder.HasIndex(o => new { o.PhoneNumber, o.ConsumedAt, o.ExpiresAt });
    }
}

public class ServiceContactConfiguration : IEntityTypeConfiguration<ServiceContact>
{
    public void Configure(EntityTypeBuilder<ServiceContact> builder)
    {
        builder.ToTable("ServiceContacts");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Category).HasConversion<byte>();
        builder.Property(c => c.Name).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Phone).HasMaxLength(20).IsRequired();
        builder.Property(c => c.Address).HasMaxLength(200);

        builder.HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.UserId, c.Category });
    }
}

public class MilkSubscriptionConfiguration : IEntityTypeConfiguration<MilkSubscription>
{
    public void Configure(EntityTypeBuilder<MilkSubscription> builder)
    {
        builder.ToTable("MilkSubscriptions");
        builder.HasKey(s => s.UserId);
        builder.Property(s => s.MorningQuantityLtr).HasColumnType("decimal(5,2)");
        builder.Property(s => s.EveningQuantityLtr).HasColumnType("decimal(5,2)");
        builder.Property(s => s.RatePerLtr).HasColumnType("decimal(8,2)");
        builder.Property(s => s.SettlementCycle).HasConversion<byte>();

        builder.HasOne(s => s.User)
            .WithOne()
            .HasForeignKey<MilkSubscription>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // NoAction, not SetNull: SQL Server rejects a second cascade path back to AspNetUsers
        // (ServiceContacts already cascades from AspNetUsers). The service clears ContactId
        // on any subscription before a contact is deleted.
        builder.HasOne(s => s.Contact)
            .WithMany()
            .HasForeignKey(s => s.ContactId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}

public class MilkDeliveryOverrideConfiguration : IEntityTypeConfiguration<MilkDeliveryOverride>
{
    public void Configure(EntityTypeBuilder<MilkDeliveryOverride> builder)
    {
        builder.ToTable("MilkDeliveryOverrides");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Slot).HasConversion<byte>();
        builder.Property(o => o.Status).HasConversion<byte>();
        builder.Property(o => o.QuantityLtr).HasColumnType("decimal(5,2)");
        builder.Property(o => o.Note).HasMaxLength(200);

        builder.HasOne(o => o.User)
            .WithMany()
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => new { o.UserId, o.Date, o.Slot }).IsUnique();
    }
}

public class MilkPauseConfiguration : IEntityTypeConfiguration<MilkPause>
{
    public void Configure(EntityTypeBuilder<MilkPause> builder)
    {
        builder.ToTable("MilkPauses");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Reason).HasMaxLength(200);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => new { p.UserId, p.StartDate, p.EndDate });
    }
}

public class MilkExtraRequestConfiguration : IEntityTypeConfiguration<MilkExtraRequest>
{
    public void Configure(EntityTypeBuilder<MilkExtraRequest> builder)
    {
        builder.ToTable("MilkExtraRequests");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Slot).HasConversion<byte>();
        builder.Property(e => e.QuantityLtr).HasColumnType("decimal(5,2)");
        builder.Property(e => e.Reason).HasMaxLength(200);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.UserId, e.Date });
    }
}

public class LaundryBatchConfiguration : IEntityTypeConfiguration<LaundryBatch>
{
    public void Configure(EntityTypeBuilder<LaundryBatch> builder)
    {
        builder.ToTable("LaundryBatches");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Status).HasConversion<byte>();
        builder.Property(b => b.ServiceType).HasConversion<byte>();
        builder.Property(b => b.Amount).HasColumnType("decimal(8,2)");
        builder.Property(b => b.ItemsJson).HasMaxLength(2000).IsRequired();
        builder.Property(b => b.Notes).HasMaxLength(200);

        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Same SQL Server multi-cascade-path issue as MilkSubscription -> ServiceContacts: NoAction,
        // not SetNull. ServiceContactService.DeleteAsync clears this column before deleting a contact.
        builder.HasOne(b => b.Contact)
            .WithMany()
            .HasForeignKey(b => b.ContactId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(b => new { b.UserId, b.Status });
    }
}

public class BillConfiguration : IEntityTypeConfiguration<Bill>
{
    public void Configure(EntityTypeBuilder<Bill> builder)
    {
        builder.ToTable("Bills");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Category).HasConversion<byte>();
        builder.Property(b => b.Recurrence).HasConversion<byte>();
        builder.Property(b => b.Name).HasMaxLength(100).IsRequired();
        builder.Property(b => b.Amount).HasColumnType("decimal(10,2)");
        builder.Property(b => b.Notes).HasMaxLength(200);

        builder.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => new { b.UserId, b.DueDate });
    }
}

public class MilkSettlementConfiguration : IEntityTypeConfiguration<MilkSettlement>
{
    public void Configure(EntityTypeBuilder<MilkSettlement> builder)
    {
        builder.ToTable("MilkSettlements");
        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.UserId, s.Year, s.Month }).IsUnique();
    }
}

public class MilkQuantityChangeConfiguration : IEntityTypeConfiguration<MilkQuantityChange>
{
    public void Configure(EntityTypeBuilder<MilkQuantityChange> builder)
    {
        builder.ToTable("MilkQuantityChanges");
        builder.HasKey(q => q.Id);
        builder.Property(q => q.MorningQuantityLtr).HasColumnType("decimal(5,2)");
        builder.Property(q => q.EveningQuantityLtr).HasColumnType("decimal(5,2)");
        builder.Property(q => q.Reason).HasMaxLength(200);

        builder.HasOne(q => q.User)
            .WithMany()
            .HasForeignKey(q => q.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(q => new { q.UserId, q.StartDate, q.EndDate });
    }
}

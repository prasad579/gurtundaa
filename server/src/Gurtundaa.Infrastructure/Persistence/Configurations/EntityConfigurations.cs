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

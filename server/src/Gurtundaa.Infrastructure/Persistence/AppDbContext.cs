using Gurtundaa.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Gurtundaa.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Reminder> Reminders => Set<Reminder>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<PhoneOtp> PhoneOtps => Set<PhoneOtp>();

    public DbSet<HouseholdProfile> HouseholdProfiles => Set<HouseholdProfile>();

    public DbSet<ServiceContact> ServiceContacts => Set<ServiceContact>();

    public DbSet<MilkSubscription> MilkSubscriptions => Set<MilkSubscription>();

    public DbSet<MilkDeliveryOverride> MilkDeliveryOverrides => Set<MilkDeliveryOverride>();

    public DbSet<MilkPause> MilkPauses => Set<MilkPause>();

    public DbSet<MilkExtraRequest> MilkExtraRequests => Set<MilkExtraRequest>();

    public DbSet<LaundryBatch> LaundryBatches => Set<LaundryBatch>();

    public DbSet<MilkQuantityChange> MilkQuantityChanges => Set<MilkQuantityChange>();

    public DbSet<MilkSettlement> MilkSettlements => Set<MilkSettlement>();

    public DbSet<Bill> Bills => Set<Bill>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

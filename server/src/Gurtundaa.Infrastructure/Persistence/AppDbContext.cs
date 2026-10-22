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

    public DbSet<ShopProfile> ShopProfiles => Set<ShopProfile>();

    public DbSet<ServiceContact> ServiceContacts => Set<ServiceContact>();

    public DbSet<MilkSubscription> MilkSubscriptions => Set<MilkSubscription>();

    public DbSet<MilkDeliveryOverride> MilkDeliveryOverrides => Set<MilkDeliveryOverride>();

    public DbSet<MilkPause> MilkPauses => Set<MilkPause>();

    public DbSet<MilkExtraRequest> MilkExtraRequests => Set<MilkExtraRequest>();

    public DbSet<LaundryBatch> LaundryBatches => Set<LaundryBatch>();

    public DbSet<MilkQuantityChange> MilkQuantityChanges => Set<MilkQuantityChange>();

    public DbSet<MilkSettlement> MilkSettlements => Set<MilkSettlement>();

    public DbSet<MilkPayment> MilkPayments => Set<MilkPayment>();

    public DbSet<Bill> Bills => Set<Bill>();

    public DbSet<QuotationRequest> QuotationRequests => Set<QuotationRequest>();

    public DbSet<QuotationRequestShopTarget> QuotationRequestShopTargets => Set<QuotationRequestShopTarget>();

    public DbSet<Quote> Quotes => Set<Quote>();

    public DbSet<HouseholdMember> HouseholdMembers => Set<HouseholdMember>();

    public DbSet<Medicine> Medicines => Set<Medicine>();

    public DbSet<DoseLog> DoseLogs => Set<DoseLog>();

    public DbSet<Prescription> Prescriptions => Set<Prescription>();

    public DbSet<ProviderLink> ProviderLinks => Set<ProviderLink>();

    public DbSet<ProviderCustomer> ProviderCustomers => Set<ProviderCustomer>();

    public DbSet<ManualMilkEntry> ManualMilkEntries => Set<ManualMilkEntry>();

    public DbSet<ManualLaundryBatch> ManualLaundryBatches => Set<ManualLaundryBatch>();

    public DbSet<LaundryPickupRequest> LaundryPickupRequests => Set<LaundryPickupRequest>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}

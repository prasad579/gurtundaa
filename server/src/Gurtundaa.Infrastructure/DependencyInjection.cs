using Gurtundaa.Application.Auth;
using Gurtundaa.Application.Household;
using Gurtundaa.Application.Laundry;
using Gurtundaa.Application.Milk;
using Gurtundaa.Application.Reminders;
using Gurtundaa.Application.ServiceContacts;
using Gurtundaa.Domain.Entities;
using Gurtundaa.Infrastructure.Auth;
using Gurtundaa.Infrastructure.Household;
using Gurtundaa.Infrastructure.Laundry;
using Gurtundaa.Infrastructure.Milk;
using Gurtundaa.Infrastructure.Persistence;
using Gurtundaa.Infrastructure.Reminders;
using Gurtundaa.Infrastructure.ServiceContacts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Gurtundaa.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Gurtundaa")
            ?? throw new InvalidOperationException("Connection string 'Gurtundaa' is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));

        services.AddIdentityCore<AppUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<AppDbContext>();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(o => o.SigningKey.Length >= 32, "Jwt:SigningKey must be at least 32 characters. Set it with dotnet user-secrets.")
            .ValidateOnStart();

        services.AddSingleton(TimeProvider.System);
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOtpSender, ConsoleOtpSender>();
        services.AddScoped<IReminderService, ReminderService>();
        services.AddScoped<IHouseholdProfileService, HouseholdProfileService>();
        services.AddScoped<IServiceContactService, ServiceContactService>();
        services.AddScoped<IMilkSubscriptionService, MilkSubscriptionService>();
        services.AddScoped<IMilkDeliveryService, MilkDeliveryService>();
        services.AddScoped<IMilkPauseService, MilkPauseService>();
        services.AddScoped<IMilkExtraRequestService, MilkExtraRequestService>();
        services.AddScoped<IMilkActivityService, MilkActivityService>();
        services.AddScoped<ILaundryBatchService, LaundryBatchService>();
        services.AddScoped<IMilkQuantityChangeService, MilkQuantityChangeService>();

        return services;
    }
}

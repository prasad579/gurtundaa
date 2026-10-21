using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Gurtundaa.Application.Common;
using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Api.Services;

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid UserId =>
        Guid.TryParse(accessor.HttpContext?.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var id)
            ? id
            : throw new UnauthorizedAccessException("No signed-in user.");

    public UserType UserType =>
        Enum.TryParse<UserType>(accessor.HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value, out var userType)
            ? userType
            : UserType.Customer;
}

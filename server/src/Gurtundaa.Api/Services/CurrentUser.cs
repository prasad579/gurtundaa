using System.IdentityModel.Tokens.Jwt;
using Gurtundaa.Application.Common;

namespace Gurtundaa.Api.Services;

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid UserId =>
        Guid.TryParse(accessor.HttpContext?.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value, out var id)
            ? id
            : throw new UnauthorizedAccessException("No signed-in user.");
}

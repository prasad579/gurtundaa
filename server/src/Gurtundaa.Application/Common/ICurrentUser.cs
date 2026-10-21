using Gurtundaa.Domain.Entities;

namespace Gurtundaa.Application.Common;

public interface ICurrentUser
{
    Guid UserId { get; }

    UserType UserType { get; }
}

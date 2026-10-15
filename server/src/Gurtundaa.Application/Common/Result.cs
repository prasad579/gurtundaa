namespace Gurtundaa.Application.Common;

public sealed record Result<T>(bool Succeeded, T? Value, IReadOnlyList<string> Errors)
{
    public static Result<T> Ok(T value) => new(true, value, []);

    public static Result<T> Fail(params string[] errors) => new(false, default, errors);
}

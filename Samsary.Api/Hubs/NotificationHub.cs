using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Samsary.Api.Hubs;

[Authorize]
public class NotificationHub : Hub { }

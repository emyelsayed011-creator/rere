using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Samsary.Infrastructure.Hubs;

[Authorize]
public class NotificationHub : Hub { }

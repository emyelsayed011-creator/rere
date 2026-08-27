# syntax=docker/dockerfile:1
# =============================================================================
# Samsary.Api Dockerfile  (multi-stage)
# -----------------------------------------------------------------------------
# Stage 1 "build"  : uses the .NET 9 SDK to restore + publish a trimmed release.
# Stage 2 "final"  : uses the smaller ASP.NET runtime image to actually run it.
# Build context    : the REPOSITORY ROOT (so it can see all referenced projects)
#                    -> see docker-compose.yml: context: .  dockerfile: src/Samsary.Api/Dockerfile
# =============================================================================

# ---- Stage 1: restore & publish -------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy ONLY the .csproj files first. Docker caches this layer, so "dotnet restore"
# is re-run only when a project file changes — not on every source edit.
COPY src/Samsary.Domain/Samsary.Domain.csproj         src/Samsary.Domain/
COPY src/Samsary.Application/Samsary.Application.csproj src/Samsary.Application/
COPY src/Samsary.Infrastructure/Samsary.Infrastructure.csproj src/Samsary.Infrastructure/
COPY src/Samsary.Api/Samsary.Api.csproj               src/Samsary.Api/
RUN dotnet restore src/Samsary.Api/Samsary.Api.csproj

# Now copy the rest of the source and publish a Release build.
COPY src/ src/
RUN dotnet publish src/Samsary.Api/Samsary.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---- Stage 2: runtime -----------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# ffmpeg is required by Xabe.FFmpeg for the video-upload / transcoding feature.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# The .NET runtime images listen on port 8080 by default (non-root friendly).
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# Copy the published output from the build stage and run it.
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Samsary.Api.dll"]

package io.github.dougalcaleb.serverstatushost;

import io.github.dougalcaleb.serverstatushost.loader.Config;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.event.server.PluginDisableEvent;
import org.bukkit.event.server.PluginEnableEvent;

public class EventHandler implements Listener {

    private final Config config;

    public EventHandler(Config config) {
        this.config = config;
    }

    @org.bukkit.event.EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        event.getPlayer().getServer().getLogger().info("Player has joined the server. Sending a Webhook update to Discord...");
        Webhook.playerJoin(event.getPlayer(), event.getPlayer().getServer(), config.getURL());
    }

    @org.bukkit.event.EventHandler
    public void onPlayerQuit(PlayerQuitEvent event) {
        event.getPlayer().getServer().getLogger().info("Player has left the server. Sending a Webhook update to Discord...");
        Webhook.playerLeave(event.getPlayer(), event.getPlayer().getServer(), config.getURL());
    }

    @org.bukkit.event.EventHandler
    public void onPluginEnable(PluginEnableEvent event) {
        if (!event.getPlugin().getName().equalsIgnoreCase("ServerStatusHost")) {
            return;
        }
        Webhook.startup(config.getURL());
    }

    @org.bukkit.event.EventHandler
    public void onPluginDisable(PluginDisableEvent event) {
        if (!event.getPlugin().getName().equalsIgnoreCase("ServerStatusHost")) {
            return;
        }
        Webhook.shutdown(config.getURL());
    }
}

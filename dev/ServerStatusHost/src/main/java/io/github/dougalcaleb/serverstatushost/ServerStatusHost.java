package io.github.dougalcaleb.serverstatushost;

import io.github.dougalcaleb.serverstatushost.loader.Config;
import org.bukkit.plugin.java.JavaPlugin;

/* TODO:
- Allow for "/statushost set x y"
 - Set health report rate
- Enable or disable "/statushost [en|dis]able"

 */

public class ServerStatusHost extends JavaPlugin {

    public static ServerStatusHost plugin;

    public static void main(String[] args) {}
    public static Config config;

    @Override
    public void onEnable() {

        plugin = this;

        getLogger().info("ServerStatusHost has activated successfully");

        config = new Config(this.getConfig());
        saveConfig();

        if (config.getURL().isEmpty()) {
            getServer().getLogger().warning("No Webhook URL has been given.");
        }

        // TPS calculator
        getServer().getScheduler().scheduleSyncRepeatingTask(this, new Lagometer(), 100L, 1L);

        // Registrations
        getServer().getPluginManager().registerEvents(new EventHandler(config), this);
        this.getCommand("statushost").setExecutor(new CommandHandler());

        // Health posting
        getServer().getScheduler().scheduleSyncRepeatingTask(this, new RegularPost(), 200L, config.getReportRate() * 20);
    }

    @Override
    public void onDisable() {
        getLogger().info("ServerStatusHost has deactivated");
    }

    public static boolean checkURL(String url) {
        if (url.trim().equals("")) {
            plugin.getLogger().severe("Webhook failure: No Webhook URL given.");
            return false;
        }
        return true;
    }

    public static void logError(Exception e) {
        plugin.getLogger().severe("Error:"+e);
        e.printStackTrace();
    }
}

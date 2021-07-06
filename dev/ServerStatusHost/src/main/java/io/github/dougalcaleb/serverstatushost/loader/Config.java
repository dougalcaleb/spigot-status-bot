package io.github.dougalcaleb.serverstatushost.loader;

import org.bukkit.configuration.file.FileConfiguration;

public class Config {
    private final FileConfiguration config;

    public Config(FileConfiguration config) {
        this.config = config;
        config.addDefault("url", "");
        config.addDefault("reportInterval", 10);
        config.options().copyDefaults(true);
    }

    public String getURL() {
        return config.getString("webhookURL");
    }

    public long getReportRate() { return config.getLong("reportInterval"); }
}
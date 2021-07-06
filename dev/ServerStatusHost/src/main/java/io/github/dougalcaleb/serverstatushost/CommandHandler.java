package io.github.dougalcaleb.serverstatushost;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;

public class CommandHandler implements CommandExecutor {
    @Override
    public boolean onCommand(CommandSender commandSender, Command command, String s, String[] args) {
        switch (args.length) {
            case 0:
                commandSender.sendMessage("Plugin is active");
                return false;
            case 1:
                switch (args[0]) {
                    case "requestrestart":
                        commandSender.sendMessage("Plugin is incomplete, but will send a restart request to the Discord server");
                        break;
                    case "health":
                        commandSender.sendMessage(DataHandler.getServerHealth());
                        break;
                    default:
                        commandSender.sendMessage("Invalid argument at position 0: '" + args[0] + "'");
                }
                return true;
        }

        return false;
    }
}

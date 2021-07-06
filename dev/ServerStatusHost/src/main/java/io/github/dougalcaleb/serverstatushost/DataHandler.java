package io.github.dougalcaleb.serverstatushost;

public class DataHandler {

    public static String getTPS() {
        return "Current TPS: " + Lagometer.getTPS();
    }

    public static String getMemory() {
        StringBuilder formatted = new StringBuilder("Current memory usage: ");
        Runtime r = Runtime.getRuntime();
        long memUsed = (r.totalMemory() - r.freeMemory()) / 1048576;
        formatted.append(memUsed).append("/").append(r.totalMemory()/1048576).append(" MB");
        return formatted.toString();
    }

    public static String getServerHealth() {
        return getTPS() + "\n" + getMemory();
    }
}
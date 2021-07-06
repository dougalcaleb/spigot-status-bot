package io.github.dougalcaleb.serverstatushost;

public class RegularPost implements Runnable {

    @Override
    public void run() {
        Webhook.healthUpdate();
    }
}

# baseline.astronatally.com deployment (nginx-ui CT, 192.168.0.126)

Target is our own nginx (nginx-ui container on Proxmox host 192.168.0.114, CT123).
Everything here is tracked so the deployment is reproducible from the repo.

- `nginx/baseline.astronatally.com.conf` → /etc/nginx/sites-enabled/ on the CT.
  Static root /var/www/baseline.astronatally.com (rsynced by scripts/deploy-web-nginx.sh);
  /billing/ proxies to 127.0.0.1:38471.
- `systemd/astronatally-billing.service` → /etc/systemd/system/ on the CT.
  Runs /opt/astronatally/billing/server.mjs with /opt/astronatally/billing.env
  (values resolved at deploy time from canonical Admin-Manual credential docs;
  never committed). Server code = repo billing/*.mjs, port 38471 per
  Admin-Manual INFRASTRUCTURE.md port policy (high, non-patterned).
- TLS: wildcard *.astronatally.com + apex via acme.sh DNS-01 (dns_namecheap) on
  the CT; installed to /etc/nginx/ssl/astronatally.com_P256/ with reloadcmd.
  NAMECHEAP_SOURCEIP in ~/.acme.sh/account.conf must equal current egress IP.
- Web deploy: `bash build_all.sh` → vite build → scripts/deploy-web-nginx.sh
  (rsync dist-web → webroot, nginx -t + reload).

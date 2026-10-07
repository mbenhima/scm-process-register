CortexSkills OnPrem / Dedicated (customer-operated) licences — vendor side only (never on a customer server)

1. The customer runs on their server:  npm run admin -- licence-request --org <domain>
   and sends you the Company name and the Organization ID it prints.
2. On the vendor signing computer, in the server folder of the source code:
   npm run sign-licence -- --company "Acme Corp" --companyId <Organization ID> --expiry 2027-12-31 --maxUsers 300 --plan BND-03 --features analytics,export,api --output ./Acme.lic
   The first run creates the key pair in server/tools/keys: vendor-private.pem (keep secret, back it up offline) and vendor-public.pem.
3. Send the customer: Acme.lic and vendor-public.pem (the same public key for every customer).
4. First activation (the customer's users cannot sign in before it), on the customer server:
   npm run admin -- licence-install --file /path/to/Acme.lic
5. Renewal or upgrade: sign a new file with the new date, users or plan. The customer administrator uploads it in
   Administration > Configuration & licence > Upload licence file (or runs licence-install again).

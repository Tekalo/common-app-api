# Data ReadMe

At it's core, Tekalo is about getting data about candidates and opportunities to talent connectors. In order to do this, we have flows for users to fill out and edit their forms, but we need to get that data into an interface that talent connectors will be comfortable interacting with. The data pipeline is responsible for fetching the data from the backend's database and loading that data into Airtable, where certain automations are enacted upon it and the talent connectors can start their work.

## ETL Pipeline

Below is a diagram describing the tools we use for our ETL process. This entire pipeline is replicated for each of our three deployment environments (dev, staging, prod).

![ETL Infrastructure Diagram](./media/tekalo_etl_infra.png 'ETL Infrastructure')

## Airtable

Airtable is used as the front-end for matchmakers. There are a few additional concepts added to the Airtable which do not appear in the rest of the system:

- Matchmaker (aka Talent Connector): One of our recruitment specialists who match candidates and opportunities.
- Match: One candidate paired with one opportunity, created by a matchmaker. A match has a status that indicates where it is in its life cycle.
- (Match) Status: The status of a match. See the "Status State Diagram" for the logic that defines this.
- Organization: A concepts that conects opportunities which come from the same company. There's some automated logic for connecting opportunities for organizations, but it's mostly managed manually.

Airtable is populated by Hightouch and has some internal automations which can be found in the base (along with their descriptions). Airtable should be setup for dev, staging, and prod environments, but only prod is used by matchmakers.

Matchmakers are meant to use the provided Airtable "interfaces" for interacting with candidates, opportunities, matches, and organizations. There are two collections of intefaces, one for SF internal and the other for matchmakers who are working at partner organizations - The SF interfaces allow you to edit almost every field, whereas the partner interfaces constrain what the matchmaker sees to what they are assigned and limits the fields they can modify. There are some actions (such as associating opportunities to organizations and assigning match makers) that are not available in either interface and must be done directly in the base; this should be a lead matchmaker who is orchestrating the reviews.

### Airtable Diagrams

Matchmaker Process: https://lucid.app/lucidchart/invitations/accept/inv_a0d8b2b0-784a-41f7-9947-9e8ebf7ab707

Status State Diagram: https://lucid.app/lucidchart/invitations/accept/inv_3c0c10c4-666a-4285-8897-cedd390fda99

### Demo Videos

Interface Overview: https://drive.google.com/file/d/1-6Sv5in0GT8kv5Rjw5_w9wuRXgGKmUk4/view?usp=drive_link

Matchmaking Demo: https://drive.google.com/file/d/1ADBK8S-aJM6fjGN5yNbhPoq5k9PIertW/view?usp=drive_link

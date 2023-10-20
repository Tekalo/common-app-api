# Data Overview

At it's core, Tekalo is about getting data about candidates and opportunities to recruiting specialists. In order to do this, we have flows for users to fill out and edit their forms, but we need to get that data into an interface that matchmakers will be comfortable interacting with. The data pipeline is responsible for fetching the data from the backend's database and loading that data into Airtable, where certain automations are acted upon it and the matchmakers can start their work.

# ETL Pipeline

Below is a diagram describing the tools we use for our ETL process. This entire pipeline is replicated for each of our three deployment environments (dev, staging, prod).


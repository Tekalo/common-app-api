# Auth0

Tekalo uses [Auth0](https://manage.auth0.com) as its authentication mechanism for applicants.

## Flow

![Authentication Flow Diagram](../docs/media/Applicant_Auth_Flow.jpeg "Auth Flow")

## Actions

Tekalo uses 3 [Auth0 actions](https://auth0.com/docs/customize/actions) to customize the login flow. All 3 actions will be triggered every time a user logs in to Tekalo.

### 1. **Add-Email-To-Access-Token***
Adds the user's email to the Auth0 access token. This allows the API to validate the JWT matches the applicant's email when calling various API endpoints that require authentication.

### 2. **Add-Role-To-Access-Token**
Adds any roles in auth0 to the Auth0 access token for reference by the API. Current roles include:
- matchmaker
- admin

Additional roles can be added through the Auth0 management console.

### 3. **Post-Social-Login-Delete-Shell-User**

When an applicant is first created in Tekalo (`POST /applicants`), the API calls the Auth0 Management API to create a shell user in Auth0. This shell user has connection type `Username-Password-Authentication` with no password set. 
In the scenario where a user creates themselves as an applicant, but leaves Tekalo before submitting their final submission and later returns to the site, they'll need to login to re-visit their submission. On return to the site:

- If the applicant tries logging in with a social identity provider, Auth0 will automatically create a new user for this applicant with connection type Google or Linkedin. Since we never want 2 Auth0 users for a single Tekalo applicant, this action will:

  1. Delete the previously created shell user in favor of the newer user with social identity provider.
  2. Add a `has_cleaned_shell_account` boolean flag to the user's `app_metadata`

  3. Set a custom `auth0.capp.com/exists_in_db` claim in the Auth0 id token

- If the applicant opts out of a social identity provider, they can create a password for their account via the Tekalo login page password reset link. The shell account allows for them to set a new password as the shell user with their email address and connection type `Username-Password-Authentication` already exists.

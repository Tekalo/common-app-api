-- Create SkillsView table view
CREATE VIEW "CausesView" AS
        SELECT
          name::citext as name,
          CASE
            WHEN suggest THEN COALESCE(canonical, name)::citext
            ELSE canonical::citext
          END AS canonical,
          suggest,
          "rejectAs"
          COALESCE(priority, false) as priority
        FROM "CausesAnnotation"

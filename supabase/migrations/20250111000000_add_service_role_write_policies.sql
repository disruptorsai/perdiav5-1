-- Add service role write policies for crawler scripts
-- These policies allow the service role to INSERT/UPDATE data from crawler scripts

-- Ranking Reports - allow service role to insert/update
CREATE POLICY "Service role can insert ranking reports" ON ranking_reports
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update ranking reports" ON ranking_reports
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Ranking Report Entries - allow service role to insert/update
CREATE POLICY "Service role can insert ranking report entries" ON ranking_report_entries
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update ranking report entries" ON ranking_report_entries
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Schools - allow service role to insert/update
CREATE POLICY "Service role can insert schools" ON schools
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update schools" ON schools
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Degrees - allow service role to insert/update
CREATE POLICY "Service role can insert degrees" ON degrees
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update degrees" ON degrees
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- GetEducated Articles - allow service role to insert/update
CREATE POLICY "Service role can insert geteducated articles" ON geteducated_articles
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update geteducated articles" ON geteducated_articles
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Comments
COMMENT ON POLICY "Service role can insert ranking reports" ON ranking_reports IS 'Allows crawler scripts using service role key to populate ranking data';
COMMENT ON POLICY "Service role can insert schools" ON schools IS 'Allows crawler scripts using service role key to populate school data';
COMMENT ON POLICY "Service role can insert degrees" ON degrees IS 'Allows crawler scripts using service role key to populate degree data';

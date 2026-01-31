-- =============================================================================
-- DESCRIPTION: Seed sample data for testing
-- TABLES: ranking_reports, ranking_report_entries, schools, degrees
-- DEPENDENCIES:
--   - 20250105000001_create_ranking_reports_tables.sql
--   - 20250105000002_create_schools_degrees_tables.sql
--   - 20250103000000_add_monetization_tables.sql
--
-- This migration populates the database with realistic sample data for testing
-- the GetEducated cost data RAG system, internal linking, and monetization features.
--
-- ROLLBACK:
--   DELETE FROM degrees WHERE school_name IN (SELECT school_name FROM schools WHERE school_slug LIKE 'sample-%' OR school_slug IN (...));
--   DELETE FROM ranking_report_entries WHERE report_id IN (SELECT id FROM ranking_reports WHERE report_slug LIKE 'sample-%');
--   DELETE FROM ranking_reports WHERE report_slug LIKE 'sample-%';
--   DELETE FROM schools WHERE school_slug LIKE 'sample-%' OR school_slug IN (...);
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 1: SCHOOLS
-- Create 40+ schools with realistic data, mix of sponsored/non-sponsored
-- =============================================================================

INSERT INTO schools (school_name, school_slug, geteducated_url, official_website, is_paid_client, is_sponsored, has_logo, school_type, accreditation, location_city, location_state, total_programs, online_programs)
VALUES
  -- Major Online Universities (Paid Clients)
  ('Southern New Hampshire University', 'southern-new-hampshire-university', '/online-schools/southern-new-hampshire-university/', 'https://www.snhu.edu', true, true, true, 'Private', 'NECHE', 'Manchester', 'NH', 200, 150),
  ('Western Governors University', 'western-governors-university', '/online-schools/western-governors-university/', 'https://www.wgu.edu', true, true, true, 'Private', 'NWCCU', 'Salt Lake City', 'UT', 60, 60),
  ('Liberty University', 'liberty-university', '/online-schools/liberty-university/', 'https://www.liberty.edu', true, true, true, 'Private', 'SACSCOC', 'Lynchburg', 'VA', 450, 350),
  ('Purdue University Global', 'purdue-university-global', '/online-schools/purdue-university-global/', 'https://www.purdueglobal.edu', true, true, true, 'Public', 'HLC', 'Indianapolis', 'IN', 180, 180),
  ('University of Phoenix', 'university-of-phoenix', '/online-schools/university-of-phoenix/', 'https://www.phoenix.edu', true, true, true, 'For-Profit', 'HLC', 'Phoenix', 'AZ', 100, 100),
  ('Capella University', 'capella-university', '/online-schools/capella-university/', 'https://www.capella.edu', true, true, true, 'For-Profit', 'HLC', 'Minneapolis', 'MN', 150, 150),
  ('Walden University', 'walden-university', '/online-schools/walden-university/', 'https://www.waldenu.edu', true, true, true, 'For-Profit', 'HLC', 'Minneapolis', 'MN', 100, 100),
  ('Grand Canyon University', 'grand-canyon-university', '/online-schools/grand-canyon-university/', 'https://www.gcu.edu', true, true, true, 'Private', 'HLC', 'Phoenix', 'AZ', 270, 200),
  ('Strayer University', 'strayer-university', '/online-schools/strayer-university/', 'https://www.strayer.edu', true, true, true, 'For-Profit', 'MSCHE', 'Washington', 'DC', 80, 80),
  ('American Public University System', 'american-public-university', '/online-schools/american-public-university/', 'https://www.apus.edu', true, true, true, 'For-Profit', 'HLC', 'Charles Town', 'WV', 200, 200),

  -- State Universities (Mix of Sponsored)
  ('Penn State World Campus', 'penn-state-world-campus', '/online-schools/penn-state-world-campus/', 'https://www.worldcampus.psu.edu', true, true, true, 'Public', 'MSCHE', 'University Park', 'PA', 175, 175),
  ('Arizona State University Online', 'arizona-state-university-online', '/online-schools/arizona-state-university-online/', 'https://asuonline.asu.edu', true, true, true, 'Public', 'HLC', 'Tempe', 'AZ', 200, 200),
  ('University of Florida Online', 'university-of-florida-online', '/online-schools/university-of-florida-online/', 'https://ufonline.ufl.edu', false, true, false, 'Public', 'SACSCOC', 'Gainesville', 'FL', 100, 100),
  ('Oregon State University Ecampus', 'oregon-state-university-ecampus', '/online-schools/oregon-state-university-ecampus/', 'https://ecampus.oregonstate.edu', false, true, false, 'Public', 'NWCCU', 'Corvallis', 'OR', 90, 90),
  ('University of Illinois Online', 'university-of-illinois-online', '/online-schools/university-of-illinois-online/', 'https://online.illinois.edu', false, false, false, 'Public', 'HLC', 'Champaign', 'IL', 85, 85),
  ('Colorado State University Online', 'colorado-state-university-online', '/online-schools/colorado-state-university-online/', 'https://online.colostate.edu', false, true, false, 'Public', 'HLC', 'Fort Collins', 'CO', 70, 70),
  ('University of North Dakota Online', 'university-of-north-dakota-online', '/online-schools/university-of-north-dakota-online/', 'https://und.edu/online/', 'false', 'false', 'false', 'Public', 'HLC', 'Grand Forks', 'ND', 100, 95),
  ('University of Massachusetts Global', 'university-of-massachusetts-global', '/online-schools/university-of-massachusetts-global/', 'https://www.umassglobal.edu', false, false, false, 'Private', 'WASC', 'Irvine', 'CA', 80, 80),
  ('Florida International University Online', 'florida-international-university-online', '/online-schools/florida-international-university-online/', 'https://fiuonline.fiu.edu', false, false, false, 'Public', 'SACSCOC', 'Miami', 'FL', 90, 75),
  ('University of Alabama Online', 'university-of-alabama-online', '/online-schools/university-of-alabama-online/', 'https://bamabydistance.ua.edu', false, true, false, 'Public', 'SACSCOC', 'Tuscaloosa', 'AL', 80, 70),

  -- Nursing Schools (Specialized)
  ('Chamberlain University', 'chamberlain-university', '/online-schools/chamberlain-university/', 'https://www.chamberlain.edu', true, true, true, 'For-Profit', 'HLC', 'Chicago', 'IL', 30, 25),
  ('Herzing University', 'herzing-university', '/online-schools/herzing-university/', 'https://www.herzing.edu', true, true, true, 'Private', 'HLC', 'Milwaukee', 'WI', 60, 50),
  ('Excelsior College', 'excelsior-college', '/online-schools/excelsior-college/', 'https://www.excelsior.edu', false, true, false, 'Private', 'MSCHE', 'Albany', 'NY', 40, 40),
  ('Western Carolina University', 'western-carolina-university', '/online-schools/western-carolina-university/', 'https://www.wcu.edu', false, false, false, 'Public', 'SACSCOC', 'Cullowhee', 'NC', 100, 45),
  ('Aspen University', 'aspen-university', '/online-schools/aspen-university/', 'https://www.aspen.edu', true, true, true, 'For-Profit', 'DEAC', 'Denver', 'CO', 20, 20),

  -- Business/MBA Schools
  ('Indiana University Online', 'indiana-university-online', '/online-schools/indiana-university-online/', 'https://online.iu.edu', false, true, false, 'Public', 'HLC', 'Bloomington', 'IN', 120, 100),
  ('George Washington University Online', 'george-washington-university-online', '/online-schools/george-washington-university-online/', 'https://online.gwu.edu', false, false, false, 'Private', 'MSCHE', 'Washington', 'DC', 75, 50),
  ('Northeastern University Online', 'northeastern-university-online', '/online-schools/northeastern-university-online/', 'https://www.northeastern.edu/online/', 'false', 'false', 'false', 'Private', 'NECHE', 'Boston', 'MA', 80, 60),
  ('University of Denver Online', 'university-of-denver-online', '/online-schools/university-of-denver-online/', 'https://universitycollege.du.edu', false, false, false, 'Private', 'HLC', 'Denver', 'CO', 50, 40),
  ('Regis University', 'regis-university', '/online-schools/regis-university/', 'https://www.regis.edu', false, false, false, 'Private', 'HLC', 'Denver', 'CO', 60, 45),

  -- Education/Teaching Schools
  ('Teachers College Columbia University', 'teachers-college-columbia', '/online-schools/teachers-college-columbia/', 'https://www.tc.columbia.edu', false, false, false, 'Private', 'MSCHE', 'New York', 'NY', 90, 30),
  ('Concordia University Online', 'concordia-university-online', '/online-schools/concordia-university-online/', 'https://online.cuw.edu', false, true, false, 'Private', 'HLC', 'Mequon', 'WI', 55, 45),
  ('National University', 'national-university', '/online-schools/national-university/', 'https://www.nu.edu', true, true, true, 'Private', 'WASC', 'San Diego', 'CA', 100, 80),
  ('University of West Florida Online', 'university-of-west-florida-online', '/online-schools/university-of-west-florida-online/', 'https://uwf.edu/online/', 'false', 'false', 'false', 'Public', 'SACSCOC', 'Pensacola', 'FL', 70, 50),
  ('Western Kentucky University Online', 'western-kentucky-university-online', '/online-schools/western-kentucky-university-online/', 'https://www.wku.edu/online/', 'false', 'false', 'false', 'Public', 'SACSCOC', 'Bowling Green', 'KY', 80, 55),

  -- Computer Science/IT Schools
  ('Georgia Tech Online', 'georgia-tech-online', '/online-schools/georgia-tech-online/', 'https://pe.gatech.edu/degrees', false, false, false, 'Public', 'SACSCOC', 'Atlanta', 'GA', 40, 25),
  ('University of Illinois iMBA', 'university-of-illinois-imba', '/online-schools/university-of-illinois-imba/', 'https://onlinemba.illinois.edu', false, false, false, 'Public', 'HLC', 'Champaign', 'IL', 10, 10),
  ('Stevens Institute of Technology Online', 'stevens-institute-online', '/online-schools/stevens-institute-online/', 'https://www.stevens.edu/online', false, false, false, 'Private', 'MSCHE', 'Hoboken', 'NJ', 45, 30),
  ('Colorado Technical University', 'colorado-technical-university', '/online-schools/colorado-technical-university/', 'https://www.coloradotech.edu', true, true, true, 'For-Profit', 'HLC', 'Colorado Springs', 'CO', 75, 75),
  ('DeVry University', 'devry-university', '/online-schools/devry-university/', 'https://www.devry.edu', true, true, true, 'For-Profit', 'HLC', 'Naperville', 'IL', 60, 60)
ON CONFLICT (school_slug) DO UPDATE SET
  school_name = EXCLUDED.school_name,
  geteducated_url = EXCLUDED.geteducated_url,
  is_paid_client = EXCLUDED.is_paid_client,
  is_sponsored = EXCLUDED.is_sponsored,
  has_logo = EXCLUDED.has_logo,
  school_type = EXCLUDED.school_type,
  accreditation = EXCLUDED.accreditation,
  total_programs = EXCLUDED.total_programs,
  online_programs = EXCLUDED.online_programs;


-- =============================================================================
-- SECTION 2: RANKING REPORTS
-- Create 10 sample ranking reports across different degree levels and fields
-- =============================================================================

INSERT INTO ranking_reports (id, report_url, report_title, report_slug, degree_level, field_of_study, category_id, concentration_id, total_programs, crawl_status, is_active)
VALUES
  -- MBA Rankings
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/best-online-mba-programs/',
   'Best Online MBA Programs 2025', 'best-online-mba-2025', 'Master', 'Business', 9, 90, 50, 'completed', true),

  -- Nursing RN to BSN Rankings
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/most-affordable-online-rn-to-bsn/',
   'Most Affordable Online RN to BSN Programs', 'affordable-rn-to-bsn-2025', 'Bachelor', 'Nursing', 13, 67, 75, 'completed', true),

  -- Computer Science Rankings
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/best-online-computer-science-degrees/',
   'Best Online Computer Science Degrees 2025', 'best-online-cs-2025', 'Bachelor', 'Computer Science & IT', 11, 289, 40, 'completed', true),

  -- MSN Rankings
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/affordable-online-msn-programs/',
   'Most Affordable Online MSN Programs', 'affordable-msn-2025', 'Master', 'Nursing', 13, 326, 60, 'completed', true),

  -- Education Leadership Rankings
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/online-educational-leadership/',
   'Best Online Educational Leadership Programs', 'education-leadership-2025', 'Master', 'Education', 12, 63, 45, 'completed', true),

  -- Accounting Rankings
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/affordable-online-accounting-degrees/',
   'Most Affordable Online Accounting Degrees', 'affordable-accounting-2025', 'Bachelor', 'Business', 9, 281, 55, 'completed', true),

  -- Data Science Rankings
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/best-online-data-science-masters/',
   'Best Online Data Science Masters Programs', 'data-science-masters-2025', 'Master', 'Computer Science & IT', 11, 387, 35, 'completed', true),

  -- Criminal Justice Rankings
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/affordable-online-criminal-justice/',
   'Most Affordable Online Criminal Justice Degrees', 'criminal-justice-2025', 'Bachelor', 'Criminal Justice, Safety & Law', 16, 84, 65, 'completed', true),

  -- Healthcare Administration Rankings
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/affordable-online-healthcare-administration/',
   'Most Affordable Online Healthcare Administration Degrees', 'healthcare-admin-2025', 'Master', 'Healthcare', 14, 71, 50, 'completed', true),

  -- Psychology Rankings
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a',
   'https://www.geteducated.com/online-college-ratings-and-rankings/best-buy-lists/affordable-online-psychology-degrees/',
   'Most Affordable Online Psychology Degrees', 'psychology-2025', 'Bachelor', 'Psychology & Human Services', 278, 336, 70, 'completed', true)
ON CONFLICT (report_url) DO UPDATE SET
  report_title = EXCLUDED.report_title,
  degree_level = EXCLUDED.degree_level,
  field_of_study = EXCLUDED.field_of_study,
  total_programs = EXCLUDED.total_programs,
  crawl_status = EXCLUDED.crawl_status;


-- =============================================================================
-- SECTION 3: RANKING REPORT ENTRIES
-- Populate each ranking report with 10-15 program entries
-- =============================================================================

-- MBA Program Entries (Report: a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Western Governors University', 'MBA - Business Administration', 'Master', 8190.00, 455.00, 36, 1, 1, 'ACBSP', '/online-schools/western-governors-university/', '100% Online', true),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'University of the People', 'MBA', 'Master', 2460.00, NULL, NULL, 2, 2, 'DEAC', '/online-schools/university-of-the-people/', '100% Online', false),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'University of Massachusetts Global', 'MBA', 'Master', 15660.00, 435.00, 36, 3, 3, 'AACSB', '/online-schools/university-of-massachusetts-global/', '100% Online', false),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Southern New Hampshire University', 'MBA', 'Master', 18810.00, 627.00, 30, 4, 4, 'ACBSP', '/online-schools/southern-new-hampshire-university/', '100% Online', true),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Purdue University Global', 'MBA', 'Master', 21150.00, 470.00, 45, 5, 5, 'ACBSP', '/online-schools/purdue-university-global/', '100% Online', true),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Liberty University', 'MBA', 'Master', 22275.00, 495.00, 45, 6, 6, 'ACBSP', '/online-schools/liberty-university/', '100% Online', true),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Grand Canyon University', 'MBA', 'Master', 23040.00, 640.00, 36, 7, 7, 'ACBSP', '/online-schools/grand-canyon-university/', '100% Online', true),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'American Public University', 'MBA', 'Master', 12600.00, 350.00, 36, 8, 8, 'ACBSP', '/online-schools/american-public-university/', '100% Online', true),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Indiana University Online', 'MBA - Kelley Direct', 'Master', 74520.00, 1550.00, 48, 9, NULL, 'AACSB', '/online-schools/indiana-university-online/', '100% Online', false),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Arizona State University', 'MBA - W. P. Carey', 'Master', 54000.00, 1500.00, 36, 10, NULL, 'AACSB', '/online-schools/arizona-state-university-online/', '100% Online', true),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Penn State World Campus', 'MBA', 'Master', 67200.00, 1120.00, 60, 11, NULL, 'AACSB', '/online-schools/penn-state-world-campus/', '100% Online', true),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'George Washington University', 'MBA', 'Master', 85500.00, 1900.00, 45, 12, NULL, 'AACSB', '/online-schools/george-washington-university-online/', '100% Online', false);

-- RN to BSN Entries (Report: b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Aspen University', 'RN to BSN', 'Bachelor', 4500.00, 150.00, 30, 1, 1, 'CCNE', '/online-schools/aspen-university/', '100% Online', true),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Western Governors University', 'RN to BSN', 'Bachelor', 6670.00, NULL, NULL, 2, 2, 'CCNE', '/online-schools/western-governors-university/', '100% Online', true),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Chamberlain University', 'RN to BSN', 'Bachelor', 18540.00, 515.00, 36, 3, 3, 'CCNE', '/online-schools/chamberlain-university/', '100% Online', true),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Purdue University Global', 'RN to BSN', 'Bachelor', 11700.00, 325.00, 36, 4, 4, 'CCNE', '/online-schools/purdue-university-global/', '100% Online', true),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Herzing University', 'RN to BSN', 'Bachelor', 13680.00, 380.00, 36, 5, 5, 'CCNE', '/online-schools/herzing-university/', '100% Online', true),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Grand Canyon University', 'RN to BSN', 'Bachelor', 15120.00, 420.00, 36, 6, 6, 'CCNE', '/online-schools/grand-canyon-university/', '100% Online', true),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'University of Alabama', 'RN to BSN', 'Bachelor', 10800.00, 360.00, 30, 7, 7, 'CCNE', '/online-schools/university-of-alabama-online/', '100% Online', false),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Florida International University', 'RN to BSN', 'Bachelor', 12600.00, 350.00, 36, 8, 8, 'CCNE', '/online-schools/florida-international-university-online/', '100% Online', false),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Excelsior College', 'RN to BSN', 'Bachelor', 11520.00, 480.00, 24, 9, 9, 'CCNE', '/online-schools/excelsior-college/', '100% Online', false),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Capella University', 'RN to BSN - FlexPath', 'Bachelor', 14000.00, NULL, NULL, 10, 10, 'CCNE', '/online-schools/capella-university/', '100% Online', true),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'Western Carolina University', 'RN to BSN', 'Bachelor', 8640.00, 288.00, 30, 11, 11, 'CCNE', '/online-schools/western-carolina-university/', '100% Online', false);

-- Computer Science Entries (Report: c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Western Governors University', 'BS Computer Science', 'Bachelor', 7450.00, NULL, NULL, 1, 1, 'ABET', '/online-schools/western-governors-university/', '100% Online', true),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'University of the People', 'BS Computer Science', 'Bachelor', 4860.00, NULL, NULL, 2, 2, 'DEAC', '/online-schools/university-of-the-people/', '100% Online', false),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Southern New Hampshire University', 'BS Computer Science', 'Bachelor', 38280.00, 319.00, 120, 3, 3, 'NECHE', '/online-schools/southern-new-hampshire-university/', '100% Online', true),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Purdue University Global', 'BS Computer Science', 'Bachelor', 39600.00, 330.00, 120, 4, 4, 'HLC', '/online-schools/purdue-university-global/', '100% Online', true),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Oregon State University', 'BS Computer Science', 'Bachelor', 31800.00, 530.00, 60, 5, 5, 'ABET', '/online-schools/oregon-state-university-ecampus/', '100% Online', false),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Colorado State University', 'BS Computer Science', 'Bachelor', 32760.00, 546.00, 60, 6, 6, 'HLC', '/online-schools/colorado-state-university-online/', '100% Online', false),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Georgia Tech', 'BS Computer Science (OMSCS)', 'Bachelor', 9920.00, 310.00, 32, 7, 7, 'ABET', '/online-schools/georgia-tech-online/', '100% Online', false),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Colorado Technical University', 'BS Computer Science', 'Bachelor', 52920.00, 441.00, 120, 8, NULL, 'HLC', '/online-schools/colorado-technical-university/', '100% Online', true),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Liberty University', 'BS Computer Science', 'Bachelor', 43200.00, 360.00, 120, 9, NULL, 'ABET', '/online-schools/liberty-university/', '100% Online', true),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'University of Florida', 'BS Computer Science', 'Bachelor', 21360.00, 356.00, 60, 10, NULL, 'ABET', '/online-schools/university-of-florida-online/', '100% Online', false);

-- MSN Entries (Report: d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Aspen University', 'MSN', 'Master', 8100.00, 225.00, 36, 1, 1, 'CCNE', '/online-schools/aspen-university/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Western Governors University', 'MSN - Nursing Leadership', 'Master', 9590.00, NULL, NULL, 2, 2, 'CCNE', '/online-schools/western-governors-university/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Walden University', 'MSN', 'Master', 25740.00, 715.00, 36, 3, 3, 'CCNE', '/online-schools/walden-university/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Capella University', 'MSN - FlexPath', 'Master', 14300.00, NULL, NULL, 4, 4, 'CCNE', '/online-schools/capella-university/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Chamberlain University', 'MSN', 'Master', 27540.00, 765.00, 36, 5, 5, 'CCNE', '/online-schools/chamberlain-university/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Grand Canyon University', 'MSN', 'Master', 18360.00, 510.00, 36, 6, 6, 'CCNE', '/online-schools/grand-canyon-university/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Purdue University Global', 'MSN', 'Master', 19800.00, 550.00, 36, 7, 7, 'CCNE', '/online-schools/purdue-university-global/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Herzing University', 'MSN', 'Master', 21600.00, 600.00, 36, 8, 8, 'CCNE', '/online-schools/herzing-university/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Liberty University', 'MSN', 'Master', 17280.00, 480.00, 36, 9, 9, 'CCNE', '/online-schools/liberty-university/', '100% Online', true),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'University of Alabama', 'MSN', 'Master', 16560.00, 460.00, 36, 10, 10, 'CCNE', '/online-schools/university-of-alabama-online/', '100% Online', false);

-- Education Leadership Entries (Report: e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Western Governors University', 'MS Educational Leadership', 'Master', 7690.00, NULL, NULL, 1, 1, 'CAEP', '/online-schools/western-governors-university/', '100% Online', true),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Southern New Hampshire University', 'MS Educational Leadership', 'Master', 18810.00, 627.00, 30, 2, 2, 'CAEP', '/online-schools/southern-new-hampshire-university/', '100% Online', true),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Grand Canyon University', 'MEd Educational Leadership', 'Master', 15840.00, 440.00, 36, 3, 3, 'CAEP', '/online-schools/grand-canyon-university/', '100% Online', true),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Liberty University', 'MEd Educational Leadership', 'Master', 14220.00, 395.00, 36, 4, 4, 'CAEP', '/online-schools/liberty-university/', '100% Online', true),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Concordia University', 'MA Educational Leadership', 'Master', 17100.00, 475.00, 36, 5, 5, 'CAEP', '/online-schools/concordia-university-online/', '100% Online', false),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Purdue University Global', 'MS Educational Administration', 'Master', 18000.00, 500.00, 36, 6, 6, 'CAEP', '/online-schools/purdue-university-global/', '100% Online', true),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'National University', 'MEd Educational Administration', 'Master', 16740.00, 465.00, 36, 7, 7, 'CAEP', '/online-schools/national-university/', '100% Online', true),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'University of West Florida', 'MEd Educational Leadership', 'Master', 12960.00, 360.00, 36, 8, 8, 'CAEP', '/online-schools/university-of-west-florida-online/', '100% Online', false),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Western Kentucky University', 'MAE School Administration', 'Master', 14400.00, 400.00, 36, 9, 9, 'CAEP', '/online-schools/western-kentucky-university-online/', '100% Online', false),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'University of North Dakota', 'MS Educational Leadership', 'Master', 15120.00, 420.00, 36, 10, 10, 'CAEP', '/online-schools/university-of-north-dakota-online/', '100% Online', false);

-- Accounting Entries (Report: f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Western Governors University', 'BS Accounting', 'Bachelor', 7450.00, NULL, NULL, 1, 1, 'ACBSP', '/online-schools/western-governors-university/', '100% Online', true),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Southern New Hampshire University', 'BS Accounting', 'Bachelor', 38280.00, 319.00, 120, 2, 2, 'ACBSP', '/online-schools/southern-new-hampshire-university/', '100% Online', true),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Liberty University', 'BS Accounting', 'Bachelor', 43200.00, 360.00, 120, 3, 3, 'ACBSP', '/online-schools/liberty-university/', '100% Online', true),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Purdue University Global', 'BS Accounting', 'Bachelor', 39600.00, 330.00, 120, 4, 4, 'ACBSP', '/online-schools/purdue-university-global/', '100% Online', true),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Grand Canyon University', 'BS Accounting', 'Bachelor', 46080.00, 384.00, 120, 5, 5, 'ACBSP', '/online-schools/grand-canyon-university/', '100% Online', true),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'University of Massachusetts Global', 'BS Accounting', 'Bachelor', 39000.00, 325.00, 120, 6, 6, 'ACBSP', '/online-schools/university-of-massachusetts-global/', '100% Online', false),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'American Public University', 'BS Accounting', 'Bachelor', 33000.00, 275.00, 120, 7, 7, 'ACBSP', '/online-schools/american-public-university/', '100% Online', true),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Strayer University', 'BS Accounting', 'Bachelor', 40500.00, 337.50, 120, 8, 8, 'ACBSP', '/online-schools/strayer-university/', '100% Online', true),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'University of Phoenix', 'BS Accounting', 'Bachelor', 47400.00, 395.00, 120, 9, 9, 'ACBSP', '/online-schools/university-of-phoenix/', '100% Online', true),
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Penn State World Campus', 'BS Accounting', 'Bachelor', 67200.00, 560.00, 120, 10, NULL, 'AACSB', '/online-schools/penn-state-world-campus/', '100% Online', true);

-- Data Science Masters Entries (Report: a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Georgia Tech', 'MS Analytics (OMSA)', 'Master', 9900.00, 275.00, 36, 1, 1, 'SACSCOC', '/online-schools/georgia-tech-online/', '100% Online', false),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'University of Illinois', 'MS Data Science (iMDS)', 'Master', 21600.00, 600.00, 36, 2, 2, 'HLC', '/online-schools/university-of-illinois-online/', '100% Online', false),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Western Governors University', 'MS Data Analytics', 'Master', 8190.00, NULL, NULL, 3, 3, 'HLC', '/online-schools/western-governors-university/', '100% Online', true),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Southern New Hampshire University', 'MS Data Analytics', 'Master', 18810.00, 627.00, 30, 4, 4, 'NECHE', '/online-schools/southern-new-hampshire-university/', '100% Online', true),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Purdue University Global', 'MS Data Analytics', 'Master', 21150.00, 470.00, 45, 5, 5, 'HLC', '/online-schools/purdue-university-global/', '100% Online', true),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'University of Denver', 'MS Data Science', 'Master', 39600.00, 1100.00, 36, 6, 6, 'HLC', '/online-schools/university-of-denver-online/', '100% Online', false),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Northeastern University', 'MS Data Science', 'Master', 55620.00, 1545.00, 36, 7, NULL, 'NECHE', '/online-schools/northeastern-university-online/', '100% Online', false),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Stevens Institute of Technology', 'MS Data Science', 'Master', 54000.00, 1500.00, 36, 8, NULL, 'MSCHE', '/online-schools/stevens-institute-online/', '100% Online', false),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Colorado Technical University', 'MS Data Analytics', 'Master', 33480.00, 930.00, 36, 9, NULL, 'HLC', '/online-schools/colorado-technical-university/', '100% Online', true),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'Capella University', 'MS Data Science', 'Master', 25380.00, 705.00, 36, 10, NULL, 'HLC', '/online-schools/capella-university/', '100% Online', true);

-- Criminal Justice Entries (Report: b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Western Governors University', 'BS Criminal Justice', 'Bachelor', 7450.00, NULL, NULL, 1, 1, 'HLC', '/online-schools/western-governors-university/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Southern New Hampshire University', 'BS Criminal Justice', 'Bachelor', 38280.00, 319.00, 120, 2, 2, 'NECHE', '/online-schools/southern-new-hampshire-university/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'American Public University', 'BS Criminal Justice', 'Bachelor', 33000.00, 275.00, 120, 3, 3, 'HLC', '/online-schools/american-public-university/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Liberty University', 'BS Criminal Justice', 'Bachelor', 43200.00, 360.00, 120, 4, 4, 'SACSCOC', '/online-schools/liberty-university/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Grand Canyon University', 'BS Criminal Justice', 'Bachelor', 46080.00, 384.00, 120, 5, 5, 'HLC', '/online-schools/grand-canyon-university/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Purdue University Global', 'BS Criminal Justice', 'Bachelor', 39600.00, 330.00, 120, 6, 6, 'HLC', '/online-schools/purdue-university-global/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'University of Phoenix', 'BS Criminal Justice Administration', 'Bachelor', 47400.00, 395.00, 120, 7, 7, 'HLC', '/online-schools/university-of-phoenix/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Strayer University', 'BS Criminal Justice', 'Bachelor', 40500.00, 337.50, 120, 8, 8, 'MSCHE', '/online-schools/strayer-university/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Colorado Technical University', 'BS Criminal Justice', 'Bachelor', 52920.00, 441.00, 120, 9, 9, 'HLC', '/online-schools/colorado-technical-university/', '100% Online', true),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Florida International University', 'BS Criminal Justice', 'Bachelor', 28800.00, 240.00, 120, 10, 10, 'SACSCOC', '/online-schools/florida-international-university-online/', '100% Online', false);

-- Healthcare Administration Entries (Report: c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Western Governors University', 'MHA Healthcare Administration', 'Master', 8190.00, NULL, NULL, 1, 1, 'CAHME', '/online-schools/western-governors-university/', '100% Online', true),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Southern New Hampshire University', 'MS Healthcare Administration', 'Master', 18810.00, 627.00, 30, 2, 2, 'NECHE', '/online-schools/southern-new-hampshire-university/', '100% Online', true),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Purdue University Global', 'MHA Healthcare Administration', 'Master', 21150.00, 470.00, 45, 3, 3, 'HLC', '/online-schools/purdue-university-global/', '100% Online', true),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Grand Canyon University', 'MHA Healthcare Administration', 'Master', 21600.00, 600.00, 36, 4, 4, 'HLC', '/online-schools/grand-canyon-university/', '100% Online', true),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Walden University', 'MHA Healthcare Administration', 'Master', 27720.00, 770.00, 36, 5, 5, 'HLC', '/online-schools/walden-university/', '100% Online', true),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Capella University', 'MHA Healthcare Administration', 'Master', 25020.00, 695.00, 36, 6, 6, 'HLC', '/online-schools/capella-university/', '100% Online', true),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'University of Phoenix', 'MHA Healthcare Administration', 'Master', 28170.00, 782.50, 36, 7, 7, 'HLC', '/online-schools/university-of-phoenix/', '100% Online', true),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Liberty University', 'MHA Healthcare Administration', 'Master', 17820.00, 495.00, 36, 8, 8, 'SACSCOC', '/online-schools/liberty-university/', '100% Online', true),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'George Washington University', 'MHA Healthcare Administration', 'Master', 54000.00, 1500.00, 36, 9, NULL, 'MSCHE', '/online-schools/george-washington-university-online/', '100% Online', false),
  ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'University of Alabama', 'MHA Healthcare Administration', 'Master', 19800.00, 550.00, 36, 10, 9, 'SACSCOC', '/online-schools/university-of-alabama-online/', '100% Online', false);

-- Psychology Entries (Report: d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a)
INSERT INTO ranking_report_entries (report_id, school_name, program_name, degree_level, total_cost, cost_per_credit, total_credits, rank_position, best_buy_rank, accreditation, geteducated_school_url, program_format, is_sponsored)
VALUES
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Western Governors University', 'BS Psychology', 'Bachelor', 7450.00, NULL, NULL, 1, 1, 'HLC', '/online-schools/western-governors-university/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Southern New Hampshire University', 'BA Psychology', 'Bachelor', 38280.00, 319.00, 120, 2, 2, 'NECHE', '/online-schools/southern-new-hampshire-university/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Purdue University Global', 'BS Psychology', 'Bachelor', 39600.00, 330.00, 120, 3, 3, 'HLC', '/online-schools/purdue-university-global/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Liberty University', 'BS Psychology', 'Bachelor', 43200.00, 360.00, 120, 4, 4, 'SACSCOC', '/online-schools/liberty-university/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Grand Canyon University', 'BS Psychology', 'Bachelor', 46080.00, 384.00, 120, 5, 5, 'HLC', '/online-schools/grand-canyon-university/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'University of Phoenix', 'BS Psychology', 'Bachelor', 47400.00, 395.00, 120, 6, 6, 'HLC', '/online-schools/university-of-phoenix/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Walden University', 'BS Psychology', 'Bachelor', 51600.00, 430.00, 120, 7, 7, 'HLC', '/online-schools/walden-university/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Capella University', 'BS Psychology', 'Bachelor', 46200.00, 385.00, 120, 8, 8, 'HLC', '/online-schools/capella-university/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'American Public University', 'BA Psychology', 'Bachelor', 33000.00, 275.00, 120, 9, 9, 'HLC', '/online-schools/american-public-university/', '100% Online', true),
  ('d0e1f2a3-b4c5-4d5e-7f8a-9b0c1d2e3f4a', 'Regis University', 'BA Psychology', 'Bachelor', 42600.00, 355.00, 120, 10, 10, 'HLC', '/online-schools/regis-university/', '100% Online', false);


-- =============================================================================
-- SECTION 4: DEGREES
-- Create degree programs linked to schools and monetization categories
-- These use the school_id foreign key and category/concentration IDs from monetization tables
-- =============================================================================

-- First, get school IDs for linking - we'll use school_name for the denormalized column
-- and reference by slug for the school_id

-- MBA/Business Degrees
INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MBA - Business Administration', 'mba-business-admin', 'Master', 4, 'Business', 9, 'Business Administration', 90,
  '/online-degrees/master/business/mba/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 36, '18-24 months'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'purdue-university-global', 'liberty-university', 'grand-canyon-university', 'arizona-state-university-online', 'penn-state-world-campus', 'indiana-university-online', 'george-washington-university-online', 'university-of-phoenix')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'BS Accounting', 'bs-accounting', 'Bachelor', 2, 'Business', 9, 'Accounting', 281,
  '/online-degrees/bachelor/business/accounting/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 120, '4 years'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'purdue-university-global', 'liberty-university', 'grand-canyon-university', 'university-of-phoenix', 'strayer-university', 'american-public-university')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MS Data Analytics', 'ms-data-analytics', 'Master', 4, 'Computer Science & IT', 11, 'Data Science', 387,
  '/online-degrees/master/computer-science/data-science/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 36, '18-24 months'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'purdue-university-global', 'georgia-tech-online', 'university-of-illinois-online', 'capella-university', 'colorado-technical-university')
ON CONFLICT DO NOTHING;

-- Nursing Degrees
INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'RN to BSN', 'rn-to-bsn', 'Bachelor', 2, 'Nursing', 13, 'RN to BSN', 67,
  '/online-degrees/bachelor/nursing/rn-to-bsn/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 30, '12-18 months'
FROM schools s WHERE s.school_slug IN ('aspen-university', 'western-governors-university', 'chamberlain-university', 'purdue-university-global', 'herzing-university', 'grand-canyon-university', 'capella-university', 'excelsior-college', 'university-of-alabama-online')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MSN - Nursing', 'msn-nursing', 'Master', 4, 'Nursing', 13, 'MSN', 326,
  '/online-degrees/master/nursing/msn/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 36, '18-24 months'
FROM schools s WHERE s.school_slug IN ('aspen-university', 'western-governors-university', 'walden-university', 'capella-university', 'chamberlain-university', 'grand-canyon-university', 'purdue-university-global', 'herzing-university', 'liberty-university')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'DNP - Doctor of Nursing Practice', 'dnp-nursing', 'Doctorate', 5, 'Nursing', 13, 'Nurse Practitioner', 330,
  '/online-degrees/doctorate/nursing/nurse-practitioner/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 75, '3-4 years'
FROM schools s WHERE s.school_slug IN ('walden-university', 'capella-university', 'grand-canyon-university', 'chamberlain-university')
ON CONFLICT DO NOTHING;

-- Computer Science Degrees
INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'BS Computer Science', 'bs-computer-science', 'Bachelor', 2, 'Computer Science & IT', 11, 'Computer Science', 289,
  '/online-degrees/bachelor/computer-science/computer-science/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 120, '4 years'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'purdue-university-global', 'oregon-state-university-ecampus', 'colorado-state-university-online', 'georgia-tech-online', 'colorado-technical-university', 'liberty-university', 'university-of-florida-online')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MS Cybersecurity', 'ms-cybersecurity', 'Master', 4, 'Criminal Justice, Safety & Law', 16, 'Cybersecurity', 293,
  '/online-degrees/master/criminal-justice/cybersecurity/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 36, '18-24 months'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'purdue-university-global', 'capella-university', 'grand-canyon-university', 'liberty-university', 'university-of-phoenix')
ON CONFLICT DO NOTHING;

-- Education Degrees
INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MEd Educational Leadership', 'med-educational-leadership', 'Master', 4, 'Education', 12, 'Education Administration', 63,
  '/online-degrees/master/education/educational-leadership/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 36, '18-24 months'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'grand-canyon-university', 'liberty-university', 'concordia-university-online', 'purdue-university-global', 'national-university', 'university-of-west-florida-online', 'western-kentucky-university-online')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'EdD Educational Leadership', 'edd-educational-leadership', 'Doctorate', 5, 'Education', 12, 'Education Administration', 63,
  '/online-degrees/doctorate/education/educational-leadership/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 60, '3-4 years'
FROM schools s WHERE s.school_slug IN ('walden-university', 'capella-university', 'grand-canyon-university', 'liberty-university')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MAT Teaching', 'mat-teaching', 'Master', 4, 'Education', 12, 'Teaching', 348,
  '/online-degrees/master/education/teaching/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 33, '12-18 months'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'grand-canyon-university', 'liberty-university', 'national-university')
ON CONFLICT DO NOTHING;

-- Criminal Justice Degrees
INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'BS Criminal Justice', 'bs-criminal-justice', 'Bachelor', 2, 'Criminal Justice, Safety & Law', 16, 'Criminal Justice', 84,
  '/online-degrees/bachelor/criminal-justice/criminal-justice/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 120, '4 years'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'american-public-university', 'liberty-university', 'grand-canyon-university', 'purdue-university-global', 'university-of-phoenix', 'strayer-university', 'colorado-technical-university')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MS Criminal Justice', 'ms-criminal-justice', 'Master', 4, 'Criminal Justice, Safety & Law', 16, 'Criminal Justice', 84,
  '/online-degrees/master/criminal-justice/criminal-justice/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 36, '18-24 months'
FROM schools s WHERE s.school_slug IN ('southern-new-hampshire-university', 'liberty-university', 'grand-canyon-university', 'capella-university', 'walden-university', 'american-public-university')
ON CONFLICT DO NOTHING;

-- Healthcare Administration Degrees
INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MHA Healthcare Administration', 'mha-healthcare-admin', 'Master', 4, 'Healthcare', 14, 'Healthcare Administration', 71,
  '/online-degrees/master/healthcare/healthcare-administration/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 36, '18-24 months'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'purdue-university-global', 'grand-canyon-university', 'walden-university', 'capella-university', 'university-of-phoenix', 'liberty-university', 'george-washington-university-online')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'BS Healthcare Administration', 'bs-healthcare-admin', 'Bachelor', 2, 'Healthcare', 14, 'Healthcare Administration', 71,
  '/online-degrees/bachelor/healthcare/healthcare-administration/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 120, '4 years'
FROM schools s WHERE s.school_slug IN ('southern-new-hampshire-university', 'purdue-university-global', 'grand-canyon-university', 'university-of-phoenix', 'liberty-university', 'walden-university')
ON CONFLICT DO NOTHING;

-- Psychology Degrees
INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'BS Psychology', 'bs-psychology', 'Bachelor', 2, 'Psychology & Human Services', 278, 'Psychology', 336,
  '/online-degrees/bachelor/psychology/psychology/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 120, '4 years'
FROM schools s WHERE s.school_slug IN ('western-governors-university', 'southern-new-hampshire-university', 'purdue-university-global', 'liberty-university', 'grand-canyon-university', 'university-of-phoenix', 'walden-university', 'capella-university', 'american-public-university')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MS Counseling', 'ms-counseling', 'Master', 4, 'Psychology & Human Services', 278, 'Counseling', 291,
  '/online-degrees/master/psychology/counseling/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 60, '2-3 years'
FROM schools s WHERE s.school_slug IN ('walden-university', 'capella-university', 'grand-canyon-university', 'liberty-university', 'southern-new-hampshire-university')
ON CONFLICT DO NOTHING;

INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'PhD Psychology', 'phd-psychology', 'Doctorate', 5, 'Psychology & Human Services', 278, 'Psychology', 336,
  '/online-degrees/doctorate/psychology/psychology/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 90, '4-6 years'
FROM schools s WHERE s.school_slug IN ('walden-university', 'capella-university', 'grand-canyon-university')
ON CONFLICT DO NOTHING;

-- Social Work Degrees
INSERT INTO degrees (school_id, school_name, program_name, program_slug, degree_level, degree_level_code, category, category_id, concentration, concentration_id, geteducated_url, is_sponsored, has_logo, sponsorship_tier, program_format, total_credits, estimated_duration)
SELECT
  s.id, s.school_name, 'MSW Social Work', 'msw-social-work', 'Master', 4, 'Psychology & Human Services', 278, 'Social Work', 342,
  '/online-degrees/master/psychology/social-work/', s.is_sponsored, s.has_logo, CASE WHEN s.is_paid_client THEN 3 ELSE 1 END, '100% Online', 60, '2-3 years'
FROM schools s WHERE s.school_slug IN ('walden-university', 'capella-university', 'university-of-denver-online', 'fordham-university')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 5: ADDITIONAL INDEXES
-- Add composite and GIN indexes for common query patterns
-- =============================================================================

-- Index for finding programs by cost range
CREATE INDEX IF NOT EXISTS idx_rre_cost_range ON ranking_report_entries(total_cost) WHERE total_cost IS NOT NULL;

-- Index for finding sponsored entries quickly
CREATE INDEX IF NOT EXISTS idx_rre_sponsored_rank ON ranking_report_entries(is_sponsored, rank_position) WHERE is_sponsored = true;

-- Composite index for degree queries by category and level
CREATE INDEX IF NOT EXISTS idx_degrees_category_level ON degrees(category_id, degree_level_code, is_sponsored DESC);

-- Index for school queries by sponsorship status
CREATE INDEX IF NOT EXISTS idx_schools_sponsored_paid ON schools(is_sponsored, is_paid_client) WHERE is_active = true;


COMMIT;

-- =============================================================================
-- NOTES FOR USAGE
-- =============================================================================
--
-- This seed data provides:
-- - 40 schools with realistic names and sponsorship/client status
-- - 10 ranking reports across different degree levels and fields
-- - 100+ ranking report entries with realistic cost data
-- - 80+ degree programs linked to schools and monetization categories
--
-- Key relationships:
-- - degrees.school_id -> schools.id (foreign key)
-- - degrees.category_id/concentration_id -> matches subjects/monetization_categories
-- - ranking_report_entries.report_id -> ranking_reports.id (foreign key)
-- - ranking_report_entries.geteducated_school_url -> can be used to link to schools
--
-- Cost data ranges reflect realistic 2024-2025 tuition:
-- - Affordable programs: $4,500 - $15,000
-- - Mid-range programs: $15,000 - $40,000
-- - Premium programs: $40,000 - $85,000
--
-- Sponsored schools are marked with is_sponsored=true and prioritized in content
-- Paid clients are marked with is_paid_client=true for revenue tracking
-- =============================================================================

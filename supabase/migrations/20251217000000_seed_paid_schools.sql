-- Seed Paid Schools and Degrees from Client Excel File
-- Data source: docs/client/List of Client Schools and Degrees for AI Training.xlsx
-- 94 schools, 4845 degree programs
-- All schools in this file are PAID CLIENTS

-- This migration creates a function to insert the data
-- and then calls it, allowing proper bypassing of RLS

-- First, create a helper function that runs as SECURITY DEFINER
CREATE OR REPLACE FUNCTION seed_paid_schools_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  school_record RECORD;
  school_uuid UUID;
BEGIN
  -- Create temp table with school data
  CREATE TEMP TABLE IF NOT EXISTS temp_schools (
    school_name TEXT,
    school_slug TEXT
  ) ON COMMIT DROP;

  -- Insert unique schools
  INSERT INTO temp_schools (school_name, school_slug) VALUES
    ('Adelphi University', 'adelphi-university'),
    ('Alvernia University', 'alvernia-university'),
    ('American Public University System', 'american-public-university-system'),
    ('American University', 'american-university'),
    ('Anna Maria College', 'anna-maria-college'),
    ('Arcadia University', 'arcadia-university'),
    ('Arizona State University', 'arizona-state-university'),
    ('Arkansas State University', 'arkansas-state-university'),
    ('Auburn University at Montgomery', 'auburn-university-at-montgomery'),
    ('Aurora University', 'aurora-university'),
    ('Avila University', 'avila-university'),
    ('Barry University', 'barry-university'),
    ('Benedictine University', 'benedictine-university'),
    ('Bowling Green State University', 'bowling-green-state-university'),
    ('Brenau University', 'brenau-university'),
    ('Campbellsville University', 'campbellsville-university'),
    ('Carlow University', 'carlow-university'),
    ('Chamberlain University', 'chamberlain-university'),
    ('Concordia University, St. Paul', 'concordia-university-st-paul'),
    ('East Central University', 'east-central-university'),
    ('East Mississippi Community College', 'east-mississippi-community-college'),
    ('East Tennessee State University', 'east-tennessee-state-university'),
    ('Eastern Oregon University', 'eastern-oregon-university'),
    ('Eastern Washington University', 'eastern-washington-university'),
    ('ECPI University', 'ecpi-university'),
    ('Emporia State University', 'emporia-state-university'),
    ('Fisher College', 'fisher-college'),
    ('Fitchburg State University', 'fitchburg-state-university'),
    ('Florida Gulf Coast University', 'florida-gulf-coast-university'),
    ('Florida Institute of Technology', 'florida-institute-of-technology'),
    ('George Mason University', 'george-mason-university'),
    ('Georgetown University', 'georgetown-university'),
    ('Grand Canyon University', 'grand-canyon-university'),
    ('Henderson State University', 'henderson-state-university'),
    ('Johns Hopkins University', 'johns-hopkins-university'),
    ('King University', 'king-university'),
    ('Lamar University', 'lamar-university'),
    ('Liberty University', 'liberty-university'),
    ('Longwood University', 'longwood-university'),
    ('Methodist University', 'methodist-university'),
    ('Michigan State University', 'michigan-state-university'),
    ('Middlebury Institute of International Studies at Monterey', 'middlebury-institute'),
    ('Millersville University of Pennsylvania', 'millersville-university'),
    ('Murray State University', 'murray-state-university'),
    ('National University', 'national-university'),
    ('New Mexico Highlands University', 'new-mexico-highlands-university'),
    ('Northern Kentucky University', 'northern-kentucky-university'),
    ('Northwest Missouri State University', 'northwest-missouri-state-university'),
    ('Ohio University', 'ohio-university'),
    ('Pittsburg State University', 'pittsburg-state-university'),
    ('Purdue Global', 'purdue-global'),
    ('Purdue University', 'purdue-university'),
    ('Radford University', 'radford-university'),
    ('Rochester Christian University', 'rochester-christian-university'),
    ('Sacred Heart University', 'sacred-heart-university'),
    ('Saint Cloud State University', 'saint-cloud-state-university'),
    ('Saint Mary''s University of Minnesota', 'saint-marys-university-minnesota'),
    ('Southeastern Oklahoma State University', 'southeastern-oklahoma-state-university'),
    ('Southern Illinois University-Carbondale', 'southern-illinois-university-carbondale'),
    ('Southern Illinois University-Edwardsville', 'southern-illinois-university-edwardsville'),
    ('Southern New Hampshire University', 'southern-new-hampshire-university'),
    ('Southern Oregon University', 'southern-oregon-university'),
    ('Southern Utah University', 'southern-utah-university'),
    ('Southwest Minnesota State University', 'southwest-minnesota-state-university'),
    ('St. Thomas University', 'st-thomas-university'),
    ('Texas A&M International University', 'texas-am-international-university'),
    ('Texas A&M University-Corpus Christi', 'texas-am-university-corpus-christi'),
    ('Texas State University', 'texas-state-university'),
    ('The University of Texas at Arlington', 'university-of-texas-arlington'),
    ('The University of Texas at Tyler', 'university-of-texas-tyler'),
    ('University of Arizona Global Campus', 'university-of-arizona-global'),
    ('University of Illinois Springfield', 'university-of-illinois-springfield'),
    ('University of Kentucky', 'university-of-kentucky'),
    ('University of Louisiana at Monroe', 'university-of-louisiana-monroe'),
    ('University of Mary Hardin-Baylor', 'university-of-mary-hardin-baylor'),
    ('University of Minnesota-Twin Cities', 'university-of-minnesota-twin-cities'),
    ('University of Mount Saint Vincent', 'university-of-mount-saint-vincent'),
    ('University of North Carolina at Pembroke', 'university-of-north-carolina-pembroke'),
    ('University of North Carolina Wilmington', 'university-of-north-carolina-wilmington'),
    ('University of Northern Colorado', 'university-of-northern-colorado'),
    ('University of South Carolina Aiken', 'university-of-south-carolina-aiken'),
    ('University of Southern Indiana', 'university-of-southern-indiana'),
    ('University of Tulsa', 'university-of-tulsa'),
    ('University of West Alabama', 'university-of-west-alabama'),
    ('University of West Florida', 'university-of-west-florida'),
    ('University of Wisconsin-Parkside', 'university-of-wisconsin-parkside'),
    ('University of Wisconsin-Superior', 'university-of-wisconsin-superior'),
    ('Wake Forest University', 'wake-forest-university'),
    ('Walden University', 'walden-university'),
    ('Widener University', 'widener-university'),
    ('William Paterson University of New Jersey', 'william-paterson-university'),
    ('Winthrop University', 'winthrop-university'),
    ('Worcester State University', 'worcester-state-university'),
    ('Youngstown State University', 'youngstown-state-university');

  -- Insert schools that don't exist, update those that do
  FOR school_record IN SELECT * FROM temp_schools LOOP
    -- Try to find existing school
    SELECT id INTO school_uuid
    FROM schools
    WHERE school_name = school_record.school_name;

    IF school_uuid IS NULL THEN
      -- Insert new school
      INSERT INTO schools (
        school_name,
        school_slug,
        geteducated_url,
        is_paid_client,
        is_sponsored,
        is_active
      ) VALUES (
        school_record.school_name,
        school_record.school_slug,
        '/online-schools/' || school_record.school_slug || '/',
        true,
        true,
        true
      );
    ELSE
      -- Update existing school
      UPDATE schools
      SET
        is_paid_client = true,
        is_sponsored = true,
        updated_at = NOW()
      WHERE id = school_uuid;
    END IF;
  END LOOP;
END;
$$;

-- Execute the function
SELECT seed_paid_schools_data();

-- Clean up
DROP FUNCTION seed_paid_schools_data();

-- Log the results
DO $$
DECLARE
  school_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO school_count FROM schools WHERE is_paid_client = true;
  RAISE NOTICE 'Paid schools in database: %', school_count;
END;
$$;

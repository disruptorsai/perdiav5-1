-- Seed subjects table with CIP code mapping from IPEDS
-- This data maps article topics to Category ID, Concentration ID, and IPEDS CIP codes
-- Based on School_Degree Category_Subject Organization - IPEDS.xlsx workbook

-- Arts & Liberal Arts (category_id: 8)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Arts & Liberal Arts', 8, 285, 'Anthropology', ARRAY['Bachelor', 'Master'], '45.0201', 'Anthropology'),
  ('Arts & Liberal Arts', 8, 18, 'Art & Architecture', ARRAY['Bachelor', 'Master'], '50.0701', 'Art History, Criticism and Conservation'),
  ('Arts & Liberal Arts', 8, 384, 'Digital Media Communications', ARRAY['Bachelor', 'Master'], '09.0702', 'Digital Communication and Media/Multimedia'),
  ('Arts & Liberal Arts', 8, 21, 'English', ARRAY['Bachelor', 'Master'], '23.0101', 'English Language and Literature, General'),
  ('Arts & Liberal Arts', 8, 22, 'Fashion & Interior Design', ARRAY['Bachelor', 'Master'], '50.0408', 'Interior Design'),
  ('Arts & Liberal Arts', 8, 112, 'Foreign Language', ARRAY['Bachelor', 'Master'], '16.0101', 'Foreign Languages and Literatures, General'),
  ('Arts & Liberal Arts', 8, 305, 'Gender Studies', ARRAY['Bachelor', 'Master'], '05.0207', 'Women''s Studies'),
  ('Arts & Liberal Arts', 8, 20, 'Graphic Design', ARRAY['Bachelor', 'Master'], '50.0409', 'Graphic Design'),
  ('Arts & Liberal Arts', 8, 311, 'History', ARRAY['Bachelor', 'Master', 'Doctorate'], '54.0101', 'History, General'),
  ('Arts & Liberal Arts', 8, 23, 'Humanities', ARRAY['Bachelor', 'Master'], '24.0103', 'Humanities/Humanistic Studies'),
  ('Arts & Liberal Arts', 8, 24, 'Liberal Arts', ARRAY['Associate', 'Bachelor'], '24.0101', 'Liberal Arts and Sciences/Liberal Studies'),
  ('Arts & Liberal Arts', 8, 315, 'Journalism', ARRAY['Bachelor', 'Master'], '09.0401', 'Journalism'),
  ('Arts & Liberal Arts', 8, 25, 'Music', ARRAY['Bachelor', 'Master'], '50.0901', 'Music, General'),
  ('Arts & Liberal Arts', 8, 335, 'Political Science', ARRAY['Bachelor', 'Master', 'Doctorate'], '45.1001', 'Political Science and Government, General'),
  ('Arts & Liberal Arts', 8, 349, 'Technical Writing', ARRAY['Bachelor', 'Master', 'Certificate'], '23.1303', 'Professional, Technical, Business, and Scientific Writing'),
  ('Arts & Liberal Arts', 8, 27, 'Writing', ARRAY['Bachelor', 'Master'], '23.1302', 'Creative Writing')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Business (category_id: 9)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Business', 9, 281, 'Accounting', ARRAY['Bachelor', 'Master'], '52.0301', 'Accounting'),
  ('Business', 9, 90, 'Business Administration', ARRAY['Bachelor', 'Master', 'Doctorate'], '52.0201', 'Business Administration and Management, General'),
  ('Business', 9, 383, 'Business Analytics', ARRAY['Bachelor', 'Master', 'Certificate'], '52.1301', 'Management Science'),
  ('Business', 9, 29, 'Business Management', ARRAY['Bachelor', 'Master'], '52.0201', 'Business Administration and Management, General'),
  ('Business', 9, 30, 'Communications', ARRAY['Bachelor', 'Master'], '09.0101', 'Communication, General'),
  ('Business', 9, 290, 'Construction Management', ARRAY['Bachelor', 'Master'], '52.2001', 'Construction Management'),
  ('Business', 9, 33, 'Digital Marketing', ARRAY['Bachelor', 'Master', 'Certificate'], '52.1499', 'Marketing, Other'),
  ('Business', 9, 41, 'Entrepreneurship', ARRAY['Bachelor', 'Master'], '52.0701', 'Entrepreneurship/Entrepreneurial Studies'),
  ('Business', 9, 28, 'Finance', ARRAY['Bachelor', 'Master'], '52.0801', 'Finance, General'),
  ('Business', 9, 357, 'General Business', ARRAY['Associate', 'Bachelor'], '52.0101', 'Business/Commerce, General'),
  ('Business', 9, 104, 'Hospitality Management', ARRAY['Bachelor', 'Master'], '52.0901', 'Hospitality Administration/Management, General'),
  ('Business', 9, 35, 'Human Resources', ARRAY['Bachelor', 'Master'], '52.1001', 'Human Resources Management/Personnel Administration, General'),
  ('Business', 9, 36, 'International Business', ARRAY['Bachelor', 'Master'], '52.1101', 'International Business/Trade/Commerce'),
  ('Business', 9, 31, 'Management Information Systems', ARRAY['Bachelor', 'Master'], '52.1201', 'Management Information Systems, General'),
  ('Business', 9, 37, 'Marketing', ARRAY['Bachelor', 'Master'], '52.1401', 'Marketing/Marketing Management, General'),
  ('Business', 9, 328, 'Nonprofit Management', ARRAY['Bachelor', 'Master', 'Certificate'], '52.0206', 'Non-Profit/Public/Organizational Management'),
  ('Business', 9, 38, 'Supply Chain Operations Management', ARRAY['Bachelor', 'Master'], '52.0203', 'Logistics, Materials, and Supply Chain Management'),
  ('Business', 9, 32, 'Organizational Leadership', ARRAY['Bachelor', 'Master', 'Doctorate'], '52.0213', 'Organizational Leadership'),
  ('Business', 9, 39, 'Project Management', ARRAY['Bachelor', 'Master', 'Certificate'], '52.0211', 'Project Management'),
  ('Business', 9, 337, 'Public Administration', ARRAY['Bachelor', 'Master', 'Doctorate'], '44.0401', 'Public Administration'),
  ('Business', 9, 40, 'Real Estate', ARRAY['Bachelor', 'Master', 'Certificate'], '52.1501', 'Real Estate'),
  ('Business', 9, 42, 'Sports Management', ARRAY['Bachelor', 'Master'], '31.0504', 'Sport and Fitness Administration/Management'),
  ('Business', 9, 105, 'Technology Management', ARRAY['Bachelor', 'Master'], '52.0299', 'Business Administration, Management and Operations, Other')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Computer Science & IT (category_id: 11)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Computer Science & IT', 11, 55, 'Computer Information Systems', ARRAY['Bachelor', 'Master'], '11.0401', 'Information Science/Studies'),
  ('Computer Science & IT', 11, 56, 'Information Technology', ARRAY['Bachelor', 'Master'], '11.0103', 'Information Technology'),
  ('Computer Science & IT', 11, 58, 'IT Management', ARRAY['Bachelor', 'Master'], '11.1003', 'Computer and Information Systems Security/Information Assurance'),
  ('Computer Science & IT', 11, 289, 'Computer Science', ARRAY['Bachelor', 'Master', 'Doctorate'], '11.0701', 'Computer Science'),
  ('Computer Science & IT', 11, 53, 'Database Administration', ARRAY['Bachelor', 'Master', 'Certificate'], '11.0802', 'Data Modeling/Warehousing and Database Administration'),
  ('Computer Science & IT', 11, 387, 'Data Science', ARRAY['Bachelor', 'Master', 'Certificate'], '30.7001', 'Data Science, General'),
  ('Computer Science & IT', 11, 54, 'Game Design', ARRAY['Bachelor', 'Master'], '50.0411', 'Game and Interactive Media Design'),
  ('Computer Science & IT', 11, 308, 'GIS', ARRAY['Bachelor', 'Master', 'Certificate'], '45.0702', 'Geographic Information Science and Cartography'),
  ('Computer Science & IT', 11, 52, 'Information Security', ARRAY['Bachelor', 'Master', 'Certificate'], '11.1003', 'Computer and Information Systems Security/Information Assurance'),
  ('Computer Science & IT', 11, 354, 'Network Administration', ARRAY['Bachelor', 'Master', 'Certificate'], '11.0901', 'Computer Systems Networking and Telecommunications'),
  ('Computer Science & IT', 11, 275, 'Software Development', ARRAY['Bachelor', 'Master'], '11.0201', 'Computer Programming/Programmer, General'),
  ('Computer Science & IT', 11, 57, 'Web Design & Development', ARRAY['Bachelor', 'Master', 'Certificate'], '11.0801', 'Web Page, Digital/Multimedia and Information Resources Design')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Criminal Justice, Safety & Law (category_id: 16)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Criminal Justice, Safety & Law', 16, 379, 'Administration', ARRAY['Bachelor', 'Master'], '43.0103', 'Criminal Justice/Law Enforcement Administration'),
  ('Criminal Justice, Safety & Law', 16, 84, 'Criminal Justice', ARRAY['Bachelor', 'Master', 'Doctorate'], '43.0104', 'Criminal Justice/Safety Studies'),
  ('Criminal Justice, Safety & Law', 16, 293, 'Cybersecurity', ARRAY['Bachelor', 'Master', 'Certificate'], '11.1003', 'Computer and Information Systems Security/Information Assurance'),
  ('Criminal Justice, Safety & Law', 16, 296, 'Emergency Management', ARRAY['Bachelor', 'Master', 'Certificate'], '43.0302', 'Crisis/Emergency/Disaster Management'),
  ('Criminal Justice, Safety & Law', 16, 301, 'Fire Science', ARRAY['Bachelor', 'Master'], '43.0203', 'Fire Science/Fire-fighting'),
  ('Criminal Justice, Safety & Law', 16, 303, 'Forensic Science', ARRAY['Bachelor', 'Master'], '43.0106', 'Forensic Science and Technology'),
  ('Criminal Justice, Safety & Law', 16, 87, 'Homeland Security', ARRAY['Bachelor', 'Master', 'Certificate'], '43.0301', 'Homeland Security'),
  ('Criminal Justice, Safety & Law', 16, 85, 'Law', ARRAY['Master', 'Doctorate'], '22.0101', 'Law'),
  ('Criminal Justice, Safety & Law', 16, 380, 'Law Enforcement', ARRAY['Bachelor', 'Master'], '43.0107', 'Criminal Justice/Police Science'),
  ('Criminal Justice, Safety & Law', 16, 332, 'Paralegal', ARRAY['Associate', 'Bachelor', 'Certificate'], '22.0302', 'Legal Assistant/Paralegal')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Education (category_id: 12)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Education', 12, 364, 'Adult Education', ARRAY['Bachelor', 'Master', 'Doctorate'], '13.1201', 'Adult and Continuing Education and Teaching'),
  ('Education', 12, 292, 'Curriculum & Instruction', ARRAY['Master', 'Doctorate'], '13.0301', 'Curriculum and Instruction'),
  ('Education', 12, 61, 'Early Childhood Education', ARRAY['Bachelor', 'Master'], '13.1210', 'Early Childhood Education and Teaching'),
  ('Education', 12, 63, 'Education Administration', ARRAY['Master', 'Doctorate'], '13.0401', 'Educational Leadership and Administration, General'),
  ('Education', 12, 385, 'Educational Psychology', ARRAY['Master', 'Doctorate'], '42.2806', 'Educational Psychology'),
  ('Education', 12, 60, 'Elementary Education', ARRAY['Bachelor', 'Master'], '13.1202', 'Elementary Education and Teaching'),
  ('Education', 12, 300, 'ESL', ARRAY['Bachelor', 'Master', 'Certificate'], '13.1401', 'Teaching English as a Second or Foreign Language/ESL Language Instructor'),
  ('Education', 12, 365, 'Family & Consumer Science', ARRAY['Bachelor', 'Master'], '19.0101', 'Family and Consumer Sciences/Human Sciences, General'),
  ('Education', 12, 65, 'General Education', ARRAY['Bachelor', 'Master'], '13.0101', 'Education, General'),
  ('Education', 12, 62, 'Gifted & Special Education', ARRAY['Bachelor', 'Master', 'Certificate'], '13.1001', 'Special Education and Teaching, General'),
  ('Education', 12, 59, 'Higher Education', ARRAY['Master', 'Doctorate'], '13.0406', 'Higher Education/Higher Education Administration'),
  ('Education', 12, 64, 'Instructional Design', ARRAY['Master', 'Doctorate', 'Certificate'], '13.0501', 'Educational/Instructional Technology'),
  ('Education', 12, 318, 'Library Science', ARRAY['Master', 'Doctorate'], '25.0101', 'Library Science/Librarianship'),
  ('Education', 12, 334, 'Physical Education & Coaching', ARRAY['Bachelor', 'Master'], '13.1314', 'Physical Education Teaching and Coaching'),
  ('Education', 12, 338, 'Reading & Literacy', ARRAY['Master', 'Certificate'], '13.1315', 'Reading Teacher Education'),
  ('Education', 12, 340, 'School Counseling', ARRAY['Master', 'Doctorate'], '13.1101', 'Counselor Education/School Counseling and Guidance Services'),
  ('Education', 12, 341, 'Secondary Education (6-12)', ARRAY['Bachelor', 'Master'], '13.1205', 'Secondary Education and Teaching'),
  ('Education', 12, 363, 'STEAM Education', ARRAY['Bachelor', 'Master'], '13.1399', 'Teacher Education and Professional Development, Specific Subject Areas, Other'),
  ('Education', 12, 366, 'Teacher Leadership', ARRAY['Master', 'Doctorate'], '13.0404', 'Educational, Instructional, and Curriculum Supervision'),
  ('Education', 12, 348, 'Teaching', ARRAY['Bachelor', 'Master'], '13.1299', 'Teacher Education and Professional Development, Specific Levels and Methods, Other')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Engineering (category_id: 280)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Engineering', 280, 283, 'Aerospace Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.0201', 'Aerospace, Aeronautical and Astronautical/Space Engineering'),
  ('Engineering', 280, 374, 'Biomedical Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.0501', 'Bioengineering and Biomedical Engineering'),
  ('Engineering', 280, 372, 'Chemical Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.0701', 'Chemical Engineering'),
  ('Engineering', 280, 287, 'Civil Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.0801', 'Civil Engineering, General'),
  ('Engineering', 280, 298, 'Computer Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.0901', 'Computer Engineering, General'),
  ('Engineering', 280, 295, 'Electrical Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.1001', 'Electrical and Electronics Engineering'),
  ('Engineering', 280, 297, 'Engineering Management', ARRAY['Bachelor', 'Master'], '15.1501', 'Engineering/Industrial Management'),
  ('Engineering', 280, 299, 'Environmental Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.1401', 'Environmental/Environmental Health Engineering'),
  ('Engineering', 280, 306, 'General Engineering', ARRAY['Bachelor', 'Master'], '14.0101', 'Engineering, General'),
  ('Engineering', 280, 313, 'Industrial Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.3501', 'Industrial Engineering'),
  ('Engineering', 280, 375, 'Manufacturing Engineering', ARRAY['Bachelor', 'Master'], '14.3601', 'Manufacturing Engineering'),
  ('Engineering', 280, 323, 'Mechanical Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.1901', 'Mechanical Engineering'),
  ('Engineering', 280, 373, 'Nuclear Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.2301', 'Nuclear Engineering'),
  ('Engineering', 280, 344, 'Software Engineering', ARRAY['Bachelor', 'Master'], '14.0903', 'Computer Software Engineering'),
  ('Engineering', 280, 347, 'Systems Engineering', ARRAY['Bachelor', 'Master', 'Doctorate'], '14.2701', 'Systems Engineering')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Healthcare (category_id: 14)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Healthcare', 14, 73, 'Dental Hygiene', ARRAY['Associate', 'Bachelor', 'Master'], '51.0602', 'Dental Hygiene/Hygienist'),
  ('Healthcare', 14, 361, 'General Healthcare', ARRAY['Bachelor', 'Master'], '51.0000', 'Health Services/Allied Health/Health Sciences, General'),
  ('Healthcare', 14, 307, 'Gerontology', ARRAY['Bachelor', 'Master', 'Certificate'], '30.1101', 'Gerontology'),
  ('Healthcare', 14, 360, 'Health & Wellness', ARRAY['Bachelor', 'Master'], '51.0001', 'Health and Wellness, General'),
  ('Healthcare', 14, 309, 'Health Informatics', ARRAY['Bachelor', 'Master', 'Certificate'], '51.0706', 'Health Information/Medical Records Administration/Administrator'),
  ('Healthcare', 14, 310, 'Health Science', ARRAY['Bachelor', 'Master'], '51.0000', 'Health Services/Allied Health/Health Sciences, General'),
  ('Healthcare', 14, 71, 'Healthcare Administration', ARRAY['Bachelor', 'Master', 'Doctorate'], '51.0701', 'Health/Health Care Administration/Management'),
  ('Healthcare', 14, 358, 'Kinesiology', ARRAY['Bachelor', 'Master', 'Doctorate'], '31.0505', 'Kinesiology and Exercise Science'),
  ('Healthcare', 14, 72, 'Medical Billing & Coding', ARRAY['Associate', 'Certificate'], '51.0713', 'Medical Insurance Coding Specialist/Coder'),
  ('Healthcare', 14, 331, 'Nutrition', ARRAY['Bachelor', 'Master'], '51.3101', 'Dietetics/Dietitian'),
  ('Healthcare', 14, 367, 'Occupational Health & Safety', ARRAY['Bachelor', 'Master', 'Certificate'], '51.2206', 'Occupational Health and Industrial Hygiene'),
  ('Healthcare', 14, 75, 'Pharmacy', ARRAY['Doctorate'], '51.2001', 'Pharmacy'),
  ('Healthcare', 14, 77, 'Public Health', ARRAY['Bachelor', 'Master', 'Doctorate'], '51.2201', 'Public Health, General'),
  ('Healthcare', 14, 78, 'Radiology', ARRAY['Associate', 'Bachelor', 'Master'], '51.0911', 'Radiologic Technology/Science - Radiographer'),
  ('Healthcare', 14, 74, 'Rehabilitation Therapies', ARRAY['Bachelor', 'Master', 'Doctorate'], '51.2301', 'Art Therapy/Therapist'),
  ('Healthcare', 14, 359, 'Speech Language Pathology', ARRAY['Master', 'Doctorate'], '51.0204', 'Audiology/Audiologist and Speech-Language Pathology/Pathologist')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Math & Science (category_id: 15)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Math & Science', 15, 284, 'Agriculture', ARRAY['Bachelor', 'Master', 'Doctorate'], '01.0000', 'Agriculture, General'),
  ('Math & Science', 15, 371, 'Animal Science', ARRAY['Bachelor', 'Master', 'Doctorate'], '01.0901', 'Animal Sciences, General'),
  ('Math & Science', 15, 368, 'Aviation', ARRAY['Bachelor', 'Master'], '49.0101', 'Aeronautics/Aviation/Aerospace Science and Technology, General'),
  ('Math & Science', 15, 369, 'Biology', ARRAY['Bachelor', 'Master', 'Doctorate'], '26.0101', 'Biology/Biological Sciences, General'),
  ('Math & Science', 15, 370, 'Biotechnology', ARRAY['Bachelor', 'Master', 'Doctorate'], '26.1201', 'Biotechnology'),
  ('Math & Science', 15, 81, 'Environmental Science', ARRAY['Bachelor', 'Master', 'Doctorate'], '03.0104', 'Environmental Science'),
  ('Math & Science', 15, 304, 'Forestry', ARRAY['Bachelor', 'Master', 'Doctorate'], '03.0501', 'Forestry, General'),
  ('Math & Science', 15, 108, 'Geography', ARRAY['Bachelor', 'Master', 'Doctorate'], '45.0701', 'Geography'),
  ('Math & Science', 15, 322, 'Mathematics', ARRAY['Bachelor', 'Master', 'Doctorate'], '27.0101', 'Mathematics, General'),
  ('Math & Science', 15, 83, 'Science', ARRAY['Bachelor', 'Master'], '40.0101', 'Physical Sciences'),
  ('Math & Science', 15, 346, 'Sustainability', ARRAY['Bachelor', 'Master', 'Certificate'], '03.0103', 'Environmental Studies')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Nursing (category_id: 13)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Nursing', 13, 390, 'Adult Gerontology (Nurse Practitioner)', ARRAY['Master', 'Doctorate'], '51.3803', 'Adult Health Nurse/Nursing'),
  ('Nursing', 13, 69, 'General Nursing', ARRAY['Associate', 'Bachelor', 'Master'], '51.3801', 'Registered Nursing/Registered Nurse'),
  ('Nursing', 13, 389, 'Mental Health (Nurse Practitioner)', ARRAY['Master', 'Doctorate'], '51.3810', 'Psychiatric/Mental Health Nurse/Nursing'),
  ('Nursing', 13, 326, 'MSN', ARRAY['Master'], '51.3801', 'Registered Nursing/Registered Nurse'),
  ('Nursing', 13, 392, 'Neonatal & Pediatrics', ARRAY['Master', 'Doctorate'], '51.3805', 'Family Practice Nurse/Nursing'),
  ('Nursing', 13, 329, 'Nurse Educator', ARRAY['Master', 'Doctorate', 'Certificate'], '51.3817', 'Nursing Education'),
  ('Nursing', 13, 388, 'Nursing Informatics', ARRAY['Master', 'Certificate'], '51.3819', 'Nursing Informatics'),
  ('Nursing', 13, 330, 'Nurse Practitioner', ARRAY['Master', 'Doctorate'], '51.3805', 'Family Practice Nurse/Nursing'),
  ('Nursing', 13, 68, 'Nursing Administration', ARRAY['Master', 'Doctorate'], '51.3802', 'Nursing Administration'),
  ('Nursing', 13, 67, 'RN to BSN', ARRAY['Bachelor'], '51.3801', 'Registered Nursing/Registered Nurse'),
  ('Nursing', 13, 355, 'RN to MSN', ARRAY['Master'], '51.3801', 'Registered Nursing/Registered Nurse'),
  ('Nursing', 13, 391, 'Womens Health', ARRAY['Master', 'Doctorate'], '51.3807', 'Perioperative/Operating Room and Surgical Nurse/Nursing')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Psychology & Human Services (category_id: 278)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Psychology & Human Services', 278, 386, 'Behavioral Science', ARRAY['Bachelor', 'Master'], '42.2813', 'Applied Behavior Analysis'),
  ('Psychology & Human Services', 278, 291, 'Counseling', ARRAY['Master', 'Doctorate'], '42.2803', 'Counseling Psychology'),
  ('Psychology & Human Services', 278, 302, 'Forensic Psychology', ARRAY['Master', 'Doctorate'], '42.2812', 'Forensic Psychology'),
  ('Psychology & Human Services', 278, 312, 'Human Services', ARRAY['Bachelor', 'Master'], '44.0000', 'Human Services, General'),
  ('Psychology & Human Services', 278, 314, 'Industrial Organizational Psychology', ARRAY['Master', 'Doctorate'], '42.2804', 'Industrial and Organizational Psychology'),
  ('Psychology & Human Services', 278, 321, 'Marriage & Family Therapy', ARRAY['Master', 'Doctorate'], '51.1505', 'Marriage and Family Therapy/Counseling'),
  ('Psychology & Human Services', 278, 336, 'Psychology', ARRAY['Bachelor', 'Master', 'Doctorate'], '42.0101', 'Psychology, General'),
  ('Psychology & Human Services', 278, 342, 'Social Work', ARRAY['Bachelor', 'Master', 'Doctorate'], '44.0701', 'Social Work'),
  ('Psychology & Human Services', 278, 343, 'Sociology', ARRAY['Bachelor', 'Master', 'Doctorate'], '45.1101', 'Sociology'),
  ('Psychology & Human Services', 278, 345, 'Substance Abuse Counseling', ARRAY['Bachelor', 'Master', 'Certificate'], '51.1501', 'Substance Abuse/Addiction Counseling')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Religion & Philosophy (category_id: 279)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('Religion & Philosophy', 279, 382, 'Biblical Studies', ARRAY['Bachelor', 'Master', 'Doctorate'], '39.0201', 'Bible/Biblical Studies'),
  ('Religion & Philosophy', 279, 294, 'Divinity', ARRAY['Master', 'Doctorate'], '39.0602', 'Divinity/Ministry'),
  ('Religion & Philosophy', 279, 317, 'Leadership & Ministry', ARRAY['Bachelor', 'Master', 'Doctorate'], '39.0501', 'Religious/Sacred Music'),
  ('Religion & Philosophy', 279, 333, 'Pastoral Counseling', ARRAY['Master', 'Doctorate'], '39.0701', 'Pastoral Studies/Counseling'),
  ('Religion & Philosophy', 279, 381, 'Philosophy', ARRAY['Bachelor', 'Master', 'Doctorate'], '38.0101', 'Philosophy'),
  ('Religion & Philosophy', 279, 339, 'Religion', ARRAY['Bachelor', 'Master', 'Doctorate'], '38.0201', 'Religion/Religious Studies'),
  ('Religion & Philosophy', 279, 350, 'Theology', ARRAY['Bachelor', 'Master', 'Doctorate'], '39.0601', 'Theology/Theological Studies'),
  ('Religion & Philosophy', 279, 327, 'Worship & Music Ministry', ARRAY['Bachelor', 'Master'], '39.0501', 'Religious/Sacred Music')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- High School Diploma (category_id: 376)
INSERT INTO subjects (field_of_study_label, category_id, concentration_id, concentration_label, degree_types, cip_main_code, cip_main_title)
VALUES
  ('High School Diploma', 376, 377, 'General', ARRAY['High School Diploma'], '32.0101', 'Basic Skills, General'),
  ('High School Diploma', 376, 378, 'Specialized', ARRAY['High School Diploma'], '32.0199', 'Basic Skills and Developmental/Remedial Education, Other')
ON CONFLICT (category_id, concentration_id) DO UPDATE SET
  field_of_study_label = EXCLUDED.field_of_study_label,
  concentration_label = EXCLUDED.concentration_label,
  degree_types = EXCLUDED.degree_types,
  cip_main_code = EXCLUDED.cip_main_code,
  cip_main_title = EXCLUDED.cip_main_title;

-- Add comment
COMMENT ON TABLE subjects IS 'IPEDS CIP code mapping seeded from GetEducated specification. Links article topics to monetization categories.';

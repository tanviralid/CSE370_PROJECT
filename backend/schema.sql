CREATE DATABASE IF NOT EXISTS safecity;
USE safecity;

CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type ENUM('admin', 'police') NOT NULL
);

CREATE TABLE IF NOT EXISTS Police_Station (
    Station_ID INT AUTO_INCREMENT PRIMARY KEY,
    Station_Name VARCHAR(255) NOT NULL,
    District VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Police (
    User_ID INT PRIMARY KEY,
    Rank VARCHAR(100),
    Station_ID INT,
    FOREIGN KEY (User_ID) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (Station_ID) REFERENCES Police_Station(Station_ID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Admin (
    User_ID INT PRIMARY KEY,
    FOREIGN KEY (User_ID) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Area (
    Area_id INT AUTO_INCREMENT PRIMARY KEY,
    district VARCHAR(255) NOT NULL,
    thana VARCHAR(255) NOT NULL,
    risk_level ENUM('Low', 'Moderate', 'High') DEFAULT 'Low'
);

CREATE TABLE IF NOT EXISTS Incident_Group (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255),
    time DATETIME,
    total_reports INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS Crime_report (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_id VARCHAR(50) UNIQUE NOT NULL,
    crime_type VARCHAR(255) NOT NULL,
    incident_time DATETIME NOT NULL,
    report_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
    victim_witness ENUM('Victim', 'Witness', 'Anonymous') DEFAULT 'Anonymous',
    area_id INT,
    group_id INT,
    verifier_id INT,
    FOREIGN KEY (area_id) REFERENCES Area(Area_id) ON DELETE SET NULL,
    FOREIGN KEY (group_id) REFERENCES Incident_Group(id) ON DELETE SET NULL,
    FOREIGN KEY (verifier_id) REFERENCES Police(User_ID) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Report_image (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    image_path VARCHAR(500) NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    report_id INT,
    FOREIGN KEY (report_id) REFERENCES Crime_report(report_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Community_Vote (
    vote_id INT AUTO_INCREMENT PRIMARY KEY,
    vote_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    vote_type ENUM('Likely True', 'Needs Verification', 'Suspicious') NOT NULL,
    report_id INT,
    FOREIGN KEY (report_id) REFERENCES Crime_report(report_id) ON DELETE CASCADE
);

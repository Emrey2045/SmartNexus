/* =========================================================
   SSMS Kurulum Scripti (Prisma schema.prisma -> SQL Server)
   İçerik: User, School, Teacher, Student, Parent + FK/Index
   Not: [User] SQL Server'da anahtar kelime olabilir, köşeli parantez kullanıldı.
========================================================= */

IF DB_ID(N'SchoolDB') IS NULL
BEGIN
  CREATE DATABASE [SchoolDB];
END
GO

USE [SchoolDB];
GO

/* --- DROP (opsiyonel, tekrar kurulum için) --- */
IF OBJECT_ID(N'dbo.Student', N'U') IS NOT NULL DROP TABLE dbo.Student;
IF OBJECT_ID(N'dbo.Teacher', N'U') IS NOT NULL DROP TABLE dbo.Teacher;
IF OBJECT_ID(N'dbo.Parent',  N'U') IS NOT NULL DROP TABLE dbo.Parent;
IF OBJECT_ID(N'dbo.School',  N'U') IS NOT NULL DROP TABLE dbo.School;
IF OBJECT_ID(N'dbo.[User]',  N'U') IS NOT NULL DROP TABLE dbo.[User];
GO

/* ===========================
   USER
=========================== */
CREATE TABLE dbo.[User] (
  id           INT IDENTITY(1,1) NOT NULL,
  name         NVARCHAR(255)     NOT NULL,
  email        NVARCHAR(320)     NOT NULL,
  password     NVARCHAR(255)     NOT NULL,
  role         NVARCHAR(50)      NOT NULL CONSTRAINT DF_User_role DEFAULT (N'student'),
  createdAt    DATETIME2(3)      NOT NULL CONSTRAINT DF_User_createdAt DEFAULT (SYSDATETIME()),
  refreshToken NVARCHAR(MAX)     NULL,
  CONSTRAINT PK_User PRIMARY KEY (id),
  CONSTRAINT UQ_User_email UNIQUE (email)
);
GO

/* ===========================
   SCHOOL
=========================== */
CREATE TABLE dbo.School (
  id        INT IDENTITY(1,1) NOT NULL,
  name      NVARCHAR(255)     NOT NULL,
  managerId INT              NULL,
  CONSTRAINT PK_School PRIMARY KEY (id),
  CONSTRAINT UQ_School_managerId UNIQUE (managerId)
);
GO

/* ===========================
   PARENT
=========================== */
CREATE TABLE dbo.Parent (
  id     INT IDENTITY(1,1) NOT NULL,
  name   NVARCHAR(255)     NOT NULL,
  phone  NVARCHAR(50)      NULL,
  email  NVARCHAR(320)     NULL,
  userId INT              NULL,
  CONSTRAINT PK_Parent PRIMARY KEY (id),
  CONSTRAINT UQ_Parent_userId UNIQUE (userId)
);
GO

/* ===========================
   TEACHER
=========================== */
CREATE TABLE dbo.Teacher (
  id        INT IDENTITY(1,1) NOT NULL,
  name      NVARCHAR(255)     NOT NULL,
  subject   NVARCHAR(255)     NOT NULL,
  className NVARCHAR(100)     NULL,
  schoolId  INT              NOT NULL,
  userId    INT              NULL,
  CONSTRAINT PK_Teacher PRIMARY KEY (id),
  CONSTRAINT UQ_Teacher_userId UNIQUE (userId)
);
GO

/* ===========================
   STUDENT
=========================== */
CREATE TABLE dbo.Student (
  id        INT IDENTITY(1,1) NOT NULL,
  name      NVARCHAR(255)     NOT NULL,
  grade     NVARCHAR(100)     NOT NULL,
  parentId  INT              NULL,
  schoolId  INT              NOT NULL,
  createdAt DATETIME2(3)      NOT NULL CONSTRAINT DF_Student_createdAt DEFAULT (SYSDATETIME()),
  userId    INT              NULL,
  CONSTRAINT PK_Student PRIMARY KEY (id),
  CONSTRAINT UQ_Student_userId UNIQUE (userId)
);
GO

/* ===========================
   FOREIGN KEYS (Prisma: onDelete/onUpdate = NoAction)
=========================== */
ALTER TABLE dbo.School
  ADD CONSTRAINT FK_School_Manager
  FOREIGN KEY (managerId) REFERENCES dbo.[User](id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.Parent
  ADD CONSTRAINT FK_Parent_User
  FOREIGN KEY (userId) REFERENCES dbo.[User](id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.Teacher
  ADD CONSTRAINT FK_Teacher_School
  FOREIGN KEY (schoolId) REFERENCES dbo.School(id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.Teacher
  ADD CONSTRAINT FK_Teacher_User
  FOREIGN KEY (userId) REFERENCES dbo.[User](id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.Student
  ADD CONSTRAINT FK_Student_School
  FOREIGN KEY (schoolId) REFERENCES dbo.School(id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.Student
  ADD CONSTRAINT FK_Student_Parent
  FOREIGN KEY (parentId) REFERENCES dbo.Parent(id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

ALTER TABLE dbo.Student
  ADD CONSTRAINT FK_Student_User
  FOREIGN KEY (userId) REFERENCES dbo.[User](id)
  ON DELETE NO ACTION ON UPDATE NO ACTION;
GO

/* ===========================
   INDEX (performans için)
=========================== */
CREATE INDEX IX_School_managerId  ON dbo.School(managerId);
CREATE INDEX IX_Parent_userId     ON dbo.Parent(userId);
CREATE INDEX IX_Teacher_schoolId  ON dbo.Teacher(schoolId);
CREATE INDEX IX_Teacher_userId    ON dbo.Teacher(userId);
CREATE INDEX IX_Student_schoolId  ON dbo.Student(schoolId);
CREATE INDEX IX_Student_parentId  ON dbo.Student(parentId);
CREATE INDEX IX_Student_userId    ON dbo.Student(userId);
GO

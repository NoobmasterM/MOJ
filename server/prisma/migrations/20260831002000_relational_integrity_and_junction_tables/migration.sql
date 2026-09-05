-- Blog author is normalized from a display string to a user foreign key. The legacy
-- author text remains temporarily for existing content and display compatibility.
ALTER TABLE "blogs" ADD COLUMN IF NOT EXISTS author_id INTEGER;
ALTER TABLE "blogs"
  ADD CONSTRAINT blogs_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES "users"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Every row in each bridge represents one relationship; composite keys prevent duplicates.
CREATE TABLE IF NOT EXISTS contest_participation (
  user_id INTEGER NOT NULL,
  contest_id INTEGER NOT NULL,
  participated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, contest_id),
  CONSTRAINT contest_participation_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES "users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT contest_participation_contest_id_fkey FOREIGN KEY (contest_id)
    REFERENCES "contests"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS problemset_interaction (
  user_id INTEGER NOT NULL,
  problemset_id INTEGER NOT NULL,
  first_interacted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_interacted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, problemset_id),
  CONSTRAINT problemset_interaction_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES "users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT problemset_interaction_problemset_id_fkey FOREIGN KEY (problemset_id)
    REFERENCES "problemsets"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Domain constraints enforce valid states and non-negative measurements/counters.
ALTER TABLE "users"
  ADD CONSTRAINT users_email_not_blank CHECK (length(btrim(email)) > 0),
  ADD CONSTRAINT users_username_not_blank CHECK (length(btrim(username)) BETWEEN 3 AND 30),
  ADD CONSTRAINT users_solved_nonnegative CHECK ("solvedProblems" >= 0),
  ADD CONSTRAINT users_contests_nonnegative CHECK ("contestsParticipated" >= 0),
  ADD CONSTRAINT users_rating_nonnegative CHECK (rating IS NULL OR rating >= 0),
  ADD CONSTRAINT users_rating_fill_range CHECK ("ratingFill" IS NULL OR "ratingFill" BETWEEN 0 AND 100);

ALTER TABLE "problemsets"
  ADD CONSTRAINT problemsets_difficulty_check CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  ADD CONSTRAINT problemsets_time_limit_positive CHECK ("timeLimit" > 0),
  ADD CONSTRAINT problemsets_memory_limit_positive CHECK ("memoryLimit" > 0),
  ADD CONSTRAINT problemsets_editorial_rating_nonnegative CHECK ("editorialRating" IS NULL OR "editorialRating" >= 0),
  ADD CONSTRAINT problemsets_editorial_fill_range CHECK ("editorialFill" IS NULL OR "editorialFill" BETWEEN 0 AND 100);

ALTER TABLE "submissions"
  ADD CONSTRAINT submissions_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'FAILED')),
  ADD CONSTRAINT submissions_execution_time_nonnegative CHECK ("executionTime" IS NULL OR "executionTime" >= 0),
  ADD CONSTRAINT submissions_test_counts_valid CHECK (
    ("testsPassed" IS NULL AND "totalTests" IS NULL) OR
    ("testsPassed" >= 0 AND "totalTests" >= 0 AND "testsPassed" <= "totalTests")
  );

ALTER TABLE "contests"
  ADD CONSTRAINT contests_time_order_check CHECK ("endTime" > "startTime"),
  ADD CONSTRAINT contests_status_check CHECK (status IN ('UPCOMING', 'ONGOING', 'FINISHED'));

ALTER TABLE "blogs"
  ADD CONSTRAINT blogs_title_not_blank CHECK (length(btrim(title)) > 0),
  ADD CONSTRAINT blogs_content_not_blank CHECK (length(btrim(content)) > 0),
  ADD CONSTRAINT blogs_views_nonnegative CHECK (views >= 0);

CREATE INDEX IF NOT EXISTS contest_participation_contest_idx ON contest_participation(contest_id);
CREATE INDEX IF NOT EXISTS problemset_interaction_problemset_idx ON problemset_interaction(problemset_id);
CREATE INDEX IF NOT EXISTS blogs_author_id_idx ON "blogs"(author_id);

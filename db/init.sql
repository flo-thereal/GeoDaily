-- GeoDaily Database Schema
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL if using OAuth
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    title VARCHAR(100) DEFAULT 'Explorer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings/preferences
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) DEFAULT 'en',
    daily_reminder_enabled BOOLEAN DEFAULT true,
    daily_reminder_time TIME DEFAULT '09:00:00',
    sound_enabled BOOLEAN DEFAULT true,
    haptic_enabled BOOLEAN DEFAULT true,
    theme VARCHAR(20) DEFAULT 'system',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats (aggregate performance data)
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_played_date DATE,
    total_days_played INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_correct_answers INTEGER DEFAULT 0,
    countries_mastered INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Continent mastery tracking
CREATE TABLE user_continent_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    continent VARCHAR(50) NOT NULL,
    mastery_percentage INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, continent)
);

-- Daily challenges - cached generated questions
CREATE TABLE daily_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_date DATE UNIQUE NOT NULL,
    tasks JSONB NOT NULL, -- Array of task objects from Gemini
    seed INTEGER NOT NULL, -- Seed used for generation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User daily challenge history
CREATE TABLE user_challenge_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_date DATE NOT NULL,
    tasks JSONB NOT NULL, -- Snapshot of tasks for this attempt
    answers JSONB NOT NULL, -- Array of {guess, isCorrect}
    score INTEGER NOT NULL,
    completed BOOLEAN DEFAULT true,
    time_taken_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, challenge_date)
);

-- Achievements/badges definition
CREATE TABLE achievements (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    category VARCHAR(50), -- 'exploration', 'streak', 'accuracy', 'speed'
    requirement_type VARCHAR(50), -- 'streak', 'countries', 'accuracy', 'speed'
    requirement_value INTEGER,
    points_reward INTEGER DEFAULT 0
);

-- User earned achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) REFERENCES achievements(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Countries reference data
CREATE TABLE countries (
    code VARCHAR(3) PRIMARY KEY, -- ISO 3166-1 alpha-2/3
    name VARCHAR(100) NOT NULL,
    capital VARCHAR(100),
    region VARCHAR(50),
    subregion VARCHAR(100),
    population BIGINT,
    area_km2 NUMERIC(12, 2),
    currency_code VARCHAR(10),
    currency_name VARCHAR(50),
    currency_symbol VARCHAR(10),
    languages JSONB, -- Array of language names
    borders JSONB, -- Array of bordering country codes
    lat NUMERIC(10, 6),
    lng NUMERIC(10, 6),
    flag_emoji VARCHAR(10),
    description TEXT,
    fun_facts JSONB -- Array of fun fact strings
);

-- User country progress
CREATE TABLE user_country_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    country_code VARCHAR(3) REFERENCES countries(code),
    flag_correct INTEGER DEFAULT 0,
    flag_attempts INTEGER DEFAULT 0,
    capital_correct INTEGER DEFAULT 0,
    capital_attempts INTEGER DEFAULT 0,
    map_correct INTEGER DEFAULT 0,
    map_attempts INTEGER DEFAULT 0,
    mastered BOOLEAN DEFAULT false, -- All categories > 80%
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, country_code)
);

-- Session tokens (for JWT refresh)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_challenge_history_user_date ON user_challenge_history(user_id, challenge_date);
CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_country_progress_user ON user_country_progress(user_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Insert default achievements
INSERT INTO achievements (id, name, description, icon, category, requirement_type, requirement_value, points_reward) VALUES
('first_steps', 'First Steps', 'Complete your first daily challenge', 'footprints', 'exploration', 'challenges', 1, 50),
('week_warrior', 'Week Warrior', 'Maintain a 7-day streak', 'flame', 'streak', 'streak', 7, 200),
('month_master', 'Month Master', 'Maintain a 30-day streak', 'crown', 'streak', 'streak', 30, 1000),
('flag_finder', 'Flag Finder', 'Correctly identify 50 flags', 'flag', 'exploration', 'flags', 50, 150),
('capital_conqueror', 'Capital Conqueror', 'Correctly identify 50 capitals', 'building', 'exploration', 'capitals', 50, 150),
('map_maven', 'Map Maven', 'Correctly locate 50 places on the map', 'map', 'exploration', 'maps', 50, 150),
('perfect_score', 'Perfect Score', 'Get 5/5 on a daily challenge', 'star', 'accuracy', 'perfect', 1, 100),
('speed_demon', 'Speed Demon', 'Complete a challenge in under 60 seconds', 'zap', 'speed', 'time', 60, 200),
('globe_trotter', 'Globe Trotter', 'Answer questions about 100 different countries', 'globe', 'exploration', 'countries', 100, 500),
('europe_expert', 'Europe Expert', 'Achieve 80% mastery in Europe', 'map-pin', 'exploration', 'continent_europe', 80, 300),
('asia_ace', 'Asia Ace', 'Achieve 80% mastery in Asia', 'map-pin', 'exploration', 'continent_asia', 80, 300),
('africa_adept', 'Africa Adept', 'Achieve 80% mastery in Africa', 'map-pin', 'exploration', 'continent_africa', 80, 300),
('americas_authority', 'Americas Authority', 'Achieve 80% mastery in the Americas', 'map-pin', 'exploration', 'continent_americas', 80, 300),
('oceania_oracle', 'Oceania Oracle', 'Achieve 80% mastery in Oceania', 'map-pin', 'exploration', 'continent_oceania', 80, 300);

-- Insert some sample countries (subset - full data would come from a migration script)
INSERT INTO countries (code, name, capital, region, subregion, population, currency_code, currency_name, currency_symbol, lat, lng, description) VALUES
('JP', 'Japan', 'Tokyo', 'Asia', 'Eastern Asia', 125800000, 'JPY', 'Japanese yen', '¥', 36.2048, 138.2529, 'An archipelago of 6,852 islands, Japan combines ancient traditions with ultra-modern technology. Its geography is 73% mountainous, featuring the iconic Mount Fuji.'),
('IN', 'India', 'New Delhi', 'Asia', 'Southern Asia', 1380004385, 'INR', 'Indian rupee', '₹', 20.5937, 78.9629, 'The world''s largest democracy and second-most populous country, known for its diverse cultures, languages, and the Himalayan mountain range.'),
('RU', 'Russia', 'Moscow', 'Europe', 'Eastern Europe', 144104080, 'RUB', 'Russian ruble', '₽', 61.5240, 105.3188, 'The largest country in the world by area, spanning 11 time zones across Europe and Asia.'),
('PT', 'Portugal', 'Lisbon', 'Europe', 'Southern Europe', 10196709, 'EUR', 'Euro', '€', 39.3999, -8.2245, 'A coastal nation on the Iberian Peninsula, known for its maritime history and Age of Discovery.'),
('KE', 'Kenya', 'Nairobi', 'Africa', 'Eastern Africa', 53771296, 'KES', 'Kenyan shilling', 'KSh', -0.0236, 37.9062, 'Home to diverse wildlife, the Great Rift Valley, and the famous Maasai Mara reserve.'),
('AU', 'Australia', 'Canberra', 'Oceania', 'Australia and New Zealand', 25499884, 'AUD', 'Australian dollar', '$', -25.2744, 133.7751, 'The world''s smallest continent and largest island, known for unique wildlife and the Great Barrier Reef.'),
('BR', 'Brazil', 'Brasília', 'Americas', 'South America', 212559417, 'BRL', 'Brazilian real', 'R$', -14.2350, -51.9253, 'The largest country in South America, home to the Amazon rainforest and vibrant cultural festivals.'),
('CA', 'Canada', 'Ottawa', 'Americas', 'Northern America', 37742154, 'CAD', 'Canadian dollar', '$', 56.1304, -106.3468, 'The second-largest country by total area, known for natural beauty and multicultural cities.'),
('FR', 'France', 'Paris', 'Europe', 'Western Europe', 67390000, 'EUR', 'Euro', '€', 46.2276, 2.2137, 'A global center of art, fashion, and culture, home to the Eiffel Tower and world-renowned cuisine.'),
('DE', 'Germany', 'Berlin', 'Europe', 'Western Europe', 83783942, 'EUR', 'Euro', '€', 51.1657, 10.4515, 'Europe''s largest economy, known for engineering excellence, rich history, and diverse landscapes.'),
('US', 'United States', 'Washington, D.C.', 'Americas', 'Northern America', 331002651, 'USD', 'United States dollar', '$', 37.0902, -95.7129, 'A federal republic of 50 states, known for cultural diversity and global influence.'),
('CN', 'China', 'Beijing', 'Asia', 'Eastern Asia', 1439323776, 'CNY', 'Chinese yuan', '¥', 35.8617, 104.1954, 'The world''s most populous country with one of the oldest civilizations, known for the Great Wall.'),
('GB', 'United Kingdom', 'London', 'Europe', 'Northern Europe', 67886011, 'GBP', 'British pound', '£', 55.3781, -3.4360, 'An island nation with a rich history, influential culture, and global financial centers.'),
('ZA', 'South Africa', 'Pretoria', 'Africa', 'Southern Africa', 59308690, 'ZAR', 'South African rand', 'R', -30.5595, 22.9375, 'Known as the Rainbow Nation for its diverse population and home to Table Mountain.'),
('NZ', 'New Zealand', 'Wellington', 'Oceania', 'Australia and New Zealand', 4822233, 'NZD', 'New Zealand dollar', '$', -40.9006, 174.8860, 'Known for stunning landscapes, Maori culture, and being the filming location of The Lord of the Rings.');

-- Create a dev user for testing (password: 'password123' - bcrypt hash)
INSERT INTO users (id, email, password_hash, display_name, avatar_url, level, title) VALUES 
('00000000-0000-0000-0000-000000000001', 'dev@geodaily.local', '$2b$10$rQrH5qYp1kR8dKjI7VzKYeYRZ7wvx9h.vM5LqZ2EjKvXZ7F3YkF2W', 'Dev User', NULL, 1, 'Explorer');

-- Insert initial stats for dev user
INSERT INTO user_stats (user_id) VALUES ('00000000-0000-0000-0000-000000000001');
INSERT INTO user_settings (user_id) VALUES ('00000000-0000-0000-0000-000000000001');

-- Initialize continent mastery for dev user
INSERT INTO user_continent_mastery (user_id, continent) VALUES 
('00000000-0000-0000-0000-000000000001', 'Europe'),
('00000000-0000-0000-0000-000000000001', 'Asia'),
('00000000-0000-0000-0000-000000000001', 'Africa'),
('00000000-0000-0000-0000-000000000001', 'Americas'),
('00000000-0000-0000-0000-000000000001', 'Oceania');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_continent_mastery_updated_at BEFORE UPDATE ON user_continent_mastery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_country_progress_updated_at BEFORE UPDATE ON user_country_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

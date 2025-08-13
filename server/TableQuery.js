const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quantity_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS food_items (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category_id INT NOT NULL REFERENCES categories(id),
        price NUMERIC(10,2) NOT NULL,
        quantity NUMERIC(10,2) DEFAULT 0,
        quantity_type_id INT NOT NULL REFERENCES quantity_types(id),
        UNIQUE(name, user_id)
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        category_id INT,
        price NUMERIC(10,2),
        quantity NUMERIC(10,2),
        quantity_type VARCHAR(255),
        purchase_date TIMESTAMP
      );

      -- Logs of consumption or waste events against a purchase
      CREATE TABLE IF NOT EXISTS consumption_logs (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
        action VARCHAR(16) NOT NULL, -- 'consumed' | 'wasted'
        quantity NUMERIC(10,2) NOT NULL,
        quantity_type VARCHAR(255),
        percentage NUMERIC(5,2), -- optional percent of original purchase
        cost_value NUMERIC(10,2), -- computed dollar value of this event
        logged_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS survey_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        type VARCHAR(50),
        stage VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS survey_question_options (
        id SERIAL PRIMARY KEY,
        question_id INT NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS survey_responses (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id INT NOT NULL REFERENCES survey_questions(id),
        response TEXT,
        response_date TIMESTAMP DEFAULT NOW()
      );
    `


    export default query
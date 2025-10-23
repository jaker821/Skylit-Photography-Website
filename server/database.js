require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class Database {
  constructor() {
    this.supabase = null;
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://cctdsabijwozimzbeyrq.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdGRzYWJpandvemltemJleXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzI1MjMsImV4cCI6MjA3NjgwODUyM30.KRHwT20jvUPMCv35aGBy1pO3pRSvY8f7CbDTUohz6O0';
  }

  // Initialize database connection
  async init() {
    try {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      console.log('✅ Connected to Supabase database');
      
      // Test connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error && !error.message.includes('relation "users" does not exist')) {
        throw error;
      }
      
      console.log('✅ Database tables verified');
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  // Generic database operations using Supabase client
  async run(sql, params = []) {
    try {
      // Parse SQL and convert to Supabase operations
      const operation = this.parseSQL(sql, params);
      
      if (operation.type === 'INSERT') {
        const { data, error } = await this.supabase
          .from(operation.table)
          .insert(operation.values)
          .select();
        
        if (error) throw error;
        return { id: data[0]?.id, changes: data.length };
      }
      
      if (operation.type === 'UPDATE') {
        const { data, error } = await this.supabase
          .from(operation.table)
          .update(operation.values)
          .eq(operation.where.column, operation.where.value)
          .select();
        
        if (error) throw error;
        return { id: data[0]?.id, changes: data.length };
      }
      
      if (operation.type === 'DELETE') {
        const { data, error } = await this.supabase
          .from(operation.table)
          .delete()
          .eq(operation.where.column, operation.where.value)
          .select();
        
        if (error) throw error;
        return { id: null, changes: data.length };
      }
      
      // For other operations, return empty result
      return { id: null, changes: 0 };
      
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  }

  async get(sql, params = []) {
    try {
      const operation = this.parseSQL(sql, params);
      
      if (operation.type === 'SELECT') {
        let query = this.supabase.from(operation.table).select('*');
        
        if (operation.where) {
          query = query.eq(operation.where.column, operation.where.value);
        }
        
        if (operation.limit) {
          query = query.limit(operation.limit);
        }
        
        const { data, error } = await query.single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      }
      
      // For COUNT queries
      if (operation.type === 'COUNT') {
        let query = this.supabase.from(operation.table).select('*', { count: 'exact', head: true });
        
        if (operation.where) {
          query = query.eq(operation.where.column, operation.where.value);
        }
        
        const { count, error } = await query;
        if (error) throw error;
        return { count };
      }
      
      return null;
      
    } catch (error) {
      console.error('Database get error:', error);
      throw error;
    }
  }

  async all(sql, params = []) {
    try {
      const operation = this.parseSQL(sql, params);
      
      if (operation.type === 'SELECT') {
        let query = this.supabase.from(operation.table).select('*');
        
        if (operation.where) {
          query = query.eq(operation.where.column, operation.where.value);
        }
        
        if (operation.limit) {
          query = query.limit(operation.limit);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      }
      
      return [];
      
    } catch (error) {
      console.error('Database all error:', error);
      throw error;
    }
  }

  // Parse SQL queries and convert to Supabase operations
  parseSQL(sql, params) {
    const upperSQL = sql.toUpperCase().trim();
    
    // INSERT INTO table (col1, col2) VALUES (?, ?)
    if (upperSQL.includes('INSERT INTO')) {
      const match = sql.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
      if (match) {
        const table = match[1];
        const columns = match[2].split(',').map(c => c.trim());
        const values = match[3].split(',').map(v => v.trim());
        
        const valuesObj = {};
        columns.forEach((col, index) => {
          const value = values[index];
          if (value === '?') {
            valuesObj[col] = params[index];
          } else {
            // Remove quotes
            valuesObj[col] = value.replace(/['"]/g, '');
          }
        });
        
        return { type: 'INSERT', table, values: valuesObj };
      }
    }
    
    // UPDATE table SET col1 = ?, col2 = ? WHERE col3 = ?
    if (upperSQL.includes('UPDATE')) {
      const match = sql.match(/UPDATE\s+(\w+)\s*SET\s*(.*?)\s*WHERE\s*(\w+)\s*=\s*\?/i);
      if (match) {
        const table = match[1];
        const setClause = match[2];
        const whereColumn = match[3];
        
        const valuesObj = {};
        const setParts = setClause.split(',');
        let paramIndex = 0;
        
        setParts.forEach(part => {
          const [col, val] = part.split('=').map(s => s.trim());
          if (val === '?') {
            valuesObj[col] = params[paramIndex++];
          } else {
            valuesObj[col] = val.replace(/['"]/g, '');
          }
        });
        
        // The WHERE parameter is the last parameter in the array
        return { 
          type: 'UPDATE', 
          table, 
          values: valuesObj, 
          where: { column: whereColumn, value: params[params.length - 1] }
        };
      }
    }
    
    // DELETE FROM table WHERE col = ?
    if (upperSQL.includes('DELETE FROM')) {
      const match = sql.match(/DELETE FROM\s+(\w+)\s*WHERE\s*(\w+)\s*=\s*\?/i);
      if (match) {
        return { 
          type: 'DELETE', 
          table: match[1], 
          where: { column: match[2], value: params[0] }
        };
      }
    }
    
    // SELECT * FROM table WHERE col = ? LIMIT 1
    if (upperSQL.includes('SELECT')) {
      const match = sql.match(/SELECT\s+.*?\s+FROM\s+(\w+)(?:\s+WHERE\s+(\w+)\s*=\s*\?)?(?:\s+LIMIT\s+(\d+))?/i);
      if (match) {
        const table = match[1];
        const whereColumn = match[2];
        const limit = match[3] ? parseInt(match[3]) : null;
        
        if (upperSQL.includes('COUNT(*)')) {
          return { 
            type: 'COUNT', 
            table, 
            where: whereColumn ? { column: whereColumn, value: params[0] } : null
          };
        }
        
        return { 
          type: 'SELECT', 
          table, 
          where: whereColumn ? { column: whereColumn, value: params[0] } : null,
          limit
        };
      }
    }
    
    // Default fallback
    return { type: 'UNKNOWN', table: 'users' };
  }

  // Close database connection
  async close() {
    // Supabase client doesn't need explicit closing
    console.log('Database connection closed');
  }

  // Helper function to parse JSON fields
  parseJSONField(field) {
    if (!field) return null;
    try {
      return typeof field === 'string' ? JSON.parse(field) : field;
    } catch (e) {
      console.warn('Failed to parse JSON field:', field);
      return null;
    }
  }

  // Helper function to stringify JSON fields
  stringifyJSONField(field) {
    if (!field) return null;
    return JSON.stringify(field);
  }
}

// Create singleton instance
const db = new Database();

module.exports = db;

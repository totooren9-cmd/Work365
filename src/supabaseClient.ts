import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lodbyjjaipyjzcazocsb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZGJ5amphaXB5anpjYXpvY3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTIyODMsImV4cCI6MjA5NTUyODI4M30.b0c53pGXWXtfkpfdnJIrUJAY9uQDINPz04Z88w6pwRA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

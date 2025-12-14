# Prompt Library

A clean, functional web app for collecting, categorizing, and storing AI prompts from across the web.

## Features

- 📝 **Add prompts** with title, full text, category, platform tags, and notes
- 🔍 **Search and filter** by keywords, category, or AI platform
- 📋 **One-click copy** to clipboard
- 🏷️ **Tag and categorize** for easy organization
- 🔗 **Track sources** to remember where you found great prompts
- 📱 **Responsive design** works on desktop and mobile

## Tech Stack

- **Frontend**: React + Vite
- **Database**: Supabase (PostgreSQL)
- **Styling**: Custom CSS (no framework bloat)
- **Hosting**: Vercel (recommended) or Netlify

## Quick Start

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click "New Project"
3. Choose a name, database password, and region
4. Wait for the project to initialize (~2 minutes)

### 2. Create the Database Table

Once your project is ready:

1. Click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Paste this SQL and click "Run":

```sql
-- Create the prompts table
create table prompts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  prompt_text text not null,
  category text not null,
  platforms text[] default '{}',
  tags text,
  source text,
  notes text
);

-- Enable Row Level Security (RLS)
alter table prompts enable row level security;

-- Create a policy that allows all operations (since this is a personal app)
create policy "Enable all operations for all users" on prompts
  for all
  using (true)
  with check (true);
```

### 3. Get Your Supabase Credentials

1. Go to "Settings" (gear icon) → "API"
2. Copy your "Project URL" 
3. Copy your "anon public" key (under "Project API keys")

### 4. Set Up the Project Locally

1. Download this project folder
2. Open Terminal and navigate to the project:
   ```bash
   cd path/to/prompt-library
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create your environment file:
   ```bash
   cp .env.example .env.local
   ```

5. Edit `.env.local` and paste your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open http://localhost:5173 in your browser

### 5. Deploy to Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New Project"
3. Import your GitHub repository (you'll need to push this code to GitHub first)
4. In "Environment Variables", add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click "Deploy"
6. Done! Your site will be live at `your-project.vercel.app`

## Pushing to GitHub (If You Haven't Already)

**Using GitHub Desktop (Easiest)**:
1. Download [GitHub Desktop](https://desktop.github.com)
2. Open GitHub Desktop
3. Click "Add" → "Add Existing Repository"
4. Select your `prompt-library` folder
5. Click "Publish Repository" 
6. Choose a name and click "Publish"

**Using the Web Interface**:
1. Go to [github.com](https://github.com) and sign in
2. Click "+" → "New repository"
3. Name it "prompt-library"
4. Create the repository
5. Follow the instructions to upload files via web interface

## Making Changes Later

### Option 1: Ask Claude for Help
1. Open a new chat with Claude
2. Say: "I have a React app in my prompt-library folder. I want to add [feature]"
3. Claude will give you the code changes
4. Copy/paste into your files
5. Test locally with `npm run dev`
6. Push to GitHub (auto-deploys to Vercel)

### Option 2: Use Cursor or VS Code
1. Open the project in Cursor or VS Code
2. Use AI assistant to make changes
3. Test and deploy

## Maintenance

- **View your data**: Go to Supabase → Table Editor → prompts table
- **Edit directly**: You can add/edit/delete records in Supabase's table editor
- **Backup**: Supabase automatically backs up your database
- **Costs**: Free tier includes 500MB database, 2GB bandwidth, 50,000 monthly active users

## Common Issues

**"Error loading prompts"**
- Check that your `.env.local` file has the correct Supabase credentials
- Make sure you created the database table
- Verify RLS policy is enabled

**Changes not appearing**
- Make sure you ran `npm run dev` after making changes
- Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

**Deploy failed**
- Check that environment variables are set in Vercel
- Make sure all dependencies are in package.json

## Future Ideas

- Browser extension for one-click saving from Twitter/LinkedIn
- Sharing individual prompts via link
- Export prompts to CSV
- Favorite/star system
- Prompt versioning (track edits over time)

## Support

This is a simple CRUD app - if you get stuck:
1. Ask Claude in a new chat
2. Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)
3. Check Vercel docs: [vercel.com/docs](https://vercel.com/docs)

## License

MIT - Use however you want!

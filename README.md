# DASSEN_SRS - Dassen Gasoline Station PMS

A modern Point of Management System (PMS) for Dassen Gasoline Station built with SvelteKit, shadcn-svelte, and Drizzle ORM.

## Features

- 📊 Daily Sales Management with calendar date picker
- 🛢️ Lubricant Products inventory management
- 💰 Cash counting and denomination tracking
- 💸 Expenses tracking
- 🌓 Dark/Light mode toggle
- 📱 Responsive design with shadcn-svelte components
- 💾 SQLite database with Drizzle ORM

## Tech Stack

- **Framework**: SvelteKit + Svelte 5
- **UI Components**: shadcn-svelte
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Runtime**: Bun

## Installation

```bash
# Clone the repository
git clone https://github.com/Zoro6302000/DASSEN_SRS.git

# Navigate to project
cd DASSEN_SRS

# Install dependencies
bun install

# Setup database
bunx drizzle-kit push

# Start development server
bun run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
bun run build
bun run preview
```

## License

MIT

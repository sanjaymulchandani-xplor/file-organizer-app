# File Organizer App

A beautiful desktop application to organize your files by format into folders. Built with Electron.js for cross-platform compatibility with a minimalistic, shadcn-inspired design.

![File Organizer App](https://img.shields.io/badge/Electron-v27.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

## Demo Video

https://www.youtube.com/watch?v=J2oKwFd46ls

## Features

- **Modern Minimalistic UI**: Clean, shadcn-inspired interface
- **Smart Organization**: Automatically categorizes files by format into 12+ categories
- **Preview Mode**: See exactly what changes will be made before organizing
- **Fast Performance**: Quick scanning and organizing with real-time feedback
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Safe Operations**: Built-in duplicate handling and error recovery
- **Detailed Info**: Comprehensive file type support information
- **Custom Icon**: Professional filer icon design

## Supported File Categories

The app organizes files into these comprehensive categories:

| Category | File Extensions |
|----------|----------------|
| **Images** | JPG, PNG, GIF, BMP, TIFF, SVG, WebP, ICO, HEIC |
| **Documents** | PDF, DOC, DOCX, TXT, RTF, ODT, Pages, MD, TEX |
| **Spreadsheets** | XLS, XLSX, CSV, ODS, Numbers |
| **Presentations** | PPT, PPTX, ODP, Key |
| **Videos** | MP4, AVI, MKV, MOV, WMV, FLV, WebM, M4V, 3GP |
| **Audio** | MP3, WAV, FLAC, AAC, OGG, WMA, M4A, Opus |
| **Archives** | ZIP, RAR, 7Z, TAR, GZ, BZ2, XZ, DMG, PKG, DEB, RPM |
| **Code** | PY, JS, HTML, CSS, Java, CPP, C, H, PHP, RB, GO, RS, Swift |
| **Executables** | EXE, MSI, APP, DEB, RPM, RUN, BIN |
| **Fonts** | TTF, OTF, WOFF, WOFF2, EOT |
| **Data** | JSON, XML, YAML, YML, SQL, DB, SQLite |
| **Design** | PSD, AI, Sketch, FIG, XD, INDD |

## Quick Start

### For Users (Ready-to-Use App)
1. Download the latest release for your platform from the [Releases](../../releases) page
2. Install and run the application
3. Select a folder to organize (Downloads, Desktop, Documents, or browse for custom)
4. Preview the organization plan
5. Organize your files with one click!

### For Developers

#### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

#### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd file-organizer-app

# Install dependencies
npm install

# Run in development mode (with DevTools)
npm run dev

# Run normally
npm start
```

#### Building the App
```bash
# Build for current platform only (faster)
npm run pack

# Build distributables for your platform
npm run build

# Build for specific platforms
npm run build-mac    # macOS (.dmg)
npm run build-win    # Windows (.exe)
npm run build-linux  # Linux (.AppImage)
```

## Distribution

After building, platform-specific files are created in the `dist` folder:
- **macOS**: `File Organizer.app` and `.dmg` installer
- **Windows**: `.exe` installer and portable executable
- **Linux**: `.AppImage` portable application

These can be shared with users who can run them without installing Node.js or dependencies.

## Project Structure

```
file-organizer-app/
├── src/
│   ├── main.js         # Main Electron process & file operations
│   ├── preload.js      # Secure IPC bridge
│   ├── index.html      # Main UI with file type info
│   ├── styles.css      # Minimalistic shadcn-inspired styling
│   └── renderer.js     # Frontend logic & navigation
├── assets/
│   ├── icon.png        # App icon (392x392px)
│   ├── icon.icns       # macOS icon format
│   └── icon.iconset/   # macOS icon source files
├── package.json        # Dependencies & build configuration
└── README.md          # This file
```

## Design System

The app uses a minimalistic design inspired by shadcn/ui:
- **CSS Custom Properties**: Consistent theming system
- **Neutral Colors**: Clean gray palette with blue accents
- **Card Components**: Elevated surfaces with subtle shadows
- **Typography**: Clear hierarchy with system fonts
- **Responsive Grid**: Adaptive layouts for different screen sizes

## Technology Stack

- **Framework**: Electron.js v27.0.0
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with file system APIs
- **Build Tool**: electron-builder
- **Icons**: Custom filer icon with multiple resolutions
- **Design**: shadcn/ui inspired component system

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions:
1. Check the existing [Issues](../../issues)
2. Create a new issue with detailed information
3. Include your platform (Windows/macOS/Linux) and version

## Acknowledgments

- Built with [Electron.js](https://electronjs.org/)
- Design inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icon design using custom filer.icon assets

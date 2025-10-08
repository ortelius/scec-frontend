export interface ImageData {
  name: string
  version: string
  releaseDate: string
  publisher: string
  description: string
  pulls: string
  updated: string
  verified: boolean
  official: boolean
  tags: string[]
  longDescription?: string
  vulnerabilities: {
    critical: number
    high: number
    medium: number
    low: number
  }
  dependencies: number
  signed: boolean
  openssfScore: number
}

export const mockResults: ImageData[] = [
  {
    name: 'nginx',
    version: 'v1.29.1',
    releaseDate: '2024-01-15',
    publisher: 'Docker Official Image',
    description: 'Official build of Nginx.',
    pulls: '10B+',
    updated: '2 days ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 8.7,
    tags: ['latest', 'stable', 'alpine', '1.25', '1.24'],
    vulnerabilities: { critical: 0, high: 2, medium: 5, low: 8 },
    dependencies: 127,
    longDescription: 'Nginx (pronounced "engine-x") is an open source reverse proxy server for HTTP, HTTPS, SMTP, POP3, and IMAP protocols, as well as a load balancer, HTTP cache, and a web server (origin server).\n\nThe nginx project started with a strong focus on high concurrency, high performance and low memory usage. It is licensed under the 2-clause BSD-like license and it runs on Linux, BSD variants, Mac OS X, Solaris, AIX, HP-UX, as well as on other *nix flavors. It also has a proof of concept port for Microsoft Windows.'
  },
  {
    name: 'ubuntu',
    version: 'v22.04',
    releaseDate: '2024-02-01',
    publisher: 'Docker Official Image',
    description: 'Ubuntu is a Debian-based Linux operating system based on free software.',
    pulls: '10B+',
    updated: '3 days ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 9.2,
    tags: ['latest', '22.04', '20.04', 'jammy', 'focal'],
    vulnerabilities: { critical: 1, high: 4, medium: 12, low: 15 },
    dependencies: 342,
    longDescription: 'Ubuntu is a Debian-based Linux operating system that runs from the desktop to the cloud, to all your internet connected things. It is the world\'s most popular operating system across public clouds and OpenStack clouds.\n\nUbuntu is developed by Canonical and the community in a meritocratic governance model. Canonical provides security updates and support for each Ubuntu release, starting from the release date and until the release reaches its designated end-of-life (EOL) date.'
  },
  {
    name: 'postgres',
    version: 'v16.2',
    releaseDate: '2024-02-10',
    publisher: 'Docker Official Image',
    description: 'The PostgreSQL object-relational database system provides reliability and data integrity.',
    pulls: '1B+',
    updated: '1 day ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 9.5,
    tags: ['latest', '16', '15', '14', 'alpine'],
    vulnerabilities: { critical: 0, high: 1, medium: 3, low: 6 },
    dependencies: 245,
    longDescription: 'PostgreSQL, often simply "Postgres", is an object-relational database management system (ORDBMS) with an emphasis on extensibility and standards-compliance.\n\nPostgreSQL is developed by the PostgreSQL Global Development Group, a diverse group of many companies and individual contributors. It is free and open-source, released under the terms of the PostgreSQL License, a permissive free-software license.'
  },
  {
    name: 'node',
    version: 'v20.11.0',
    releaseDate: '2024-01-28',
    publisher: 'Docker Official Image',
    description: 'Node.js is a JavaScript-based platform for server-side and networking applications.',
    pulls: '5B+',
    updated: '1 week ago',
    verified: true,
    official: true,
    signed: false,
    openssfScore: 7.8,
    tags: ['latest', '20', '18', 'lts', 'alpine'],
    vulnerabilities: { critical: 2, high: 6, medium: 10, low: 20 },
    dependencies: 1247,
    longDescription: 'Node.js is a software platform for scalable server-side and networking applications. Node.js applications are written in JavaScript and can be run within the Node.js runtime on Mac OS X, Windows, and Linux without changes.\n\nNode.js applications are designed to maximize throughput and efficiency, using non-blocking I/O and asynchronous events. Node.js applications run single-threaded, although Node.js uses multiple threads for file and network events.'
  },
  {
    name: 'redis',
    version: 'v7.2.4',
    releaseDate: '2024-01-05',
    publisher: 'Docker Official Image',
    description: 'Redis is an open source key-value store that functions as a data structure server.',
    pulls: '5B+',
    updated: '2 weeks ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 8.9,
    tags: ['latest', '7', '6', 'alpine'],
    vulnerabilities: { critical: 0, high: 0, medium: 2, low: 4 },
    dependencies: 89,
    longDescription: 'Redis is an open-source, networked, in-memory, key-value data store with optional durability. It is written in ANSI C. The development of Redis is sponsored by Redis Labs today; before that, it was sponsored by Pivotal and VMware.\n\nRedis supports different kinds of abstract data structures, such as strings, lists, maps, sets, sorted sets, hyperloglogs, bitmaps, streams and spatial indexes.'
  },
  {
    name: 'mysql',
    version: 'v8.3.0',
    releaseDate: '2024-02-05',
    publisher: 'Docker Official Image',
    description: 'MySQL is a widely used, open-source relational database management system (RDBMS).',
    pulls: '10B+',
    updated: '4 days ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 8.4,
    tags: ['latest', '8', '5.7', 'oracle'],
    vulnerabilities: { critical: 0, high: 3, medium: 7, low: 11 },
    dependencies: 298,
    longDescription: 'MySQL is the world\'s most popular open source database. With its proven performance, reliability and ease-of-use, MySQL has become the leading database choice for web-based applications.\n\nMySQL is a relational database management system. A relational database stores data in separate tables rather than putting all the data in one big storeroom. This adds speed and flexibility.'
  },
  {
    name: 'mongo',
    version: 'v7.0.5',
    releaseDate: '2024-01-20',
    publisher: 'Docker Official Image',
    description: 'MongoDB document databases provide high availability and easy scalability.',
    pulls: '5B+',
    updated: '5 days ago',
    verified: false,
    official: true,
    signed: false,
    openssfScore: 6.5,
    tags: ['latest', '7', '6', '5'],
    vulnerabilities: { critical: 1, high: 2, medium: 8, low: 14 },
    dependencies: 412,
    longDescription: 'MongoDB is a source-available cross-platform document-oriented database program. Classified as a NoSQL database program, MongoDB uses JSON-like documents with optional schemas.\n\nMongoDB is developed by MongoDB Inc. and licensed under the Server Side Public License which is deemed non-free by several distributions.'
  },
  {
    name: 'python',
    version: 'v3.12.1',
    releaseDate: '2024-01-18',
    publisher: 'Docker Official Image',
    description: 'Python is an interpreted, interactive, object-oriented, open-source programming language.',
    pulls: '5B+',
    updated: '1 week ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 9.1,
    tags: ['latest', '3.12', '3.11', '3.10', 'alpine'],
    vulnerabilities: { critical: 0, high: 1, medium: 4, low: 9 },
    dependencies: 567,
    longDescription: 'Python is an interpreted, interactive, object-oriented, open-source programming language. It incorporates modules, exceptions, dynamic typing, very high level dynamic data types, and classes.\n\nPython combines remarkable power with very clear syntax. It has interfaces to many system calls and libraries, as well as to various window systems, and is extensible in C or C++.'
  },
  {
    name: 'alpine',
    version: 'v3.19.0',
    releaseDate: '2024-02-08',
    publisher: 'Docker Official Image',
    description: 'A minimal Docker image based on Alpine Linux with a complete package index.',
    pulls: '10B+',
    updated: '3 days ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 9.8,
    tags: ['latest', '3.19', '3.18', 'edge'],
    vulnerabilities: { critical: 0, high: 0, medium: 1, low: 2 },
    dependencies: 42,
    longDescription: 'Alpine Linux is a Linux distribution built around musl libc and BusyBox. The image is only 5 MB in size and has access to a package repository that is much more complete than other BusyBox based images.\n\nThis makes Alpine Linux a great image base for utilities and even production applications. Alpine Linux is designed for security, simplicity and resource efficiency.'
  },
  {
    name: 'httpd',
    version: 'v2.4.58',
    releaseDate: '2024-01-10',
    publisher: 'Docker Official Image',
    description: 'The Apache HTTP Server Project',
    pulls: '1B+',
    updated: '1 week ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 8.2,
    tags: ['latest', '2.4', 'alpine'],
    vulnerabilities: { critical: 0, high: 2, medium: 5, low: 7 },
    dependencies: 156,
    longDescription: 'The Apache HTTP Server, colloquially called Apache, is a free and open-source cross-platform web server software, released under the terms of Apache License 2.0.\n\nApache is developed and maintained by an open community of developers under the auspices of the Apache Software Foundation.'
  },
  {
    name: 'golang',
    version: 'v1.21.6',
    releaseDate: '2024-02-03',
    publisher: 'Docker Official Image',
    description: 'Go (golang) is a general purpose, higher-level, imperative programming language.',
    pulls: '1B+',
    updated: '4 days ago',
    verified: true,
    official: true,
    signed: true,
    openssfScore: 9.3,
    tags: ['latest', '1.21', '1.20', 'alpine'],
    vulnerabilities: { critical: 0, high: 1, medium: 3, low: 5 },
    dependencies: 189,
    longDescription: 'Go is an open source programming language that makes it easy to build simple, reliable, and efficient software. Go is expressive, concise, clean, and efficient.\n\nGo compiles quickly to machine code yet has the convenience of garbage collection and the power of run-time reflection. It\'s a fast, statically typed, compiled language that feels like a dynamically typed, interpreted language.'
  },
  {
    name: 'php',
    version: 'v8.3.2',
    releaseDate: '2024-01-25',
    publisher: 'Docker Official Image',
    description: 'PHP is a server-side scripting language designed for web development.',
    pulls: '1B+',
    updated: '6 days ago',
    verified: false,
    official: true,
    signed: false,
    openssfScore: 5.9,
    tags: ['latest', '8.3', '8.2', 'apache', 'fpm'],
    vulnerabilities: { critical: 3, high: 8, medium: 15, low: 22 },
    dependencies: 834,
    longDescription: 'PHP is a popular general-purpose scripting language that is especially suited to web development. Fast, flexible and pragmatic, PHP powers everything from your blog to the most popular websites in the world.\n\nPHP is a server-side scripting language designed primarily for web development but also used as a general-purpose programming language.'
  }
]

export function getImageByName (name: string): ImageData | undefined {
  return mockResults.find(img => img.name.toLowerCase() === name.toLowerCase())
}

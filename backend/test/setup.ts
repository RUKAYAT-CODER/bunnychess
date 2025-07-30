import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

// Mock Redis
jest.mock('@nestjs-modules/ioredis', () => ({
    RedisModule: {
        forRoot: jest.fn().mockReturnValue({
            module: class MockRedisModule { },
            providers: [],
        }),
    },
    getRedisToken: jest.fn(),
}));

// Mock NATS
jest.mock('@pietrobassi/nestjs-nats-jetstream-transport', () => ({
    NatsJetStreamTransport: {
        register: jest.fn().mockReturnValue({
            module: class MockNatsModule { },
            providers: [],
        }),
    },
}));

// Mock BullMQ
jest.mock('@nestjs/bullmq', () => ({
    BullModule: {
        forRoot: jest.fn().mockReturnValue({
            module: class MockBullModule { },
            providers: [],
        }),
        registerQueue: jest.fn().mockReturnValue({
            module: class MockQueueModule { },
            providers: [],
        }),
    },
    InjectQueue: jest.fn(),
}));

// Mock JWT
jest.mock('@nestjs/jwt', () => ({
    JwtModule: {
        register: jest.fn().mockReturnValue({
            module: class MockJwtModule { },
            providers: [],
        }),
    },
    JwtService: jest.fn().mockImplementation(() => ({
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
        verify: jest.fn().mockReturnValue({ sub: 'mock-user-id' }),
        verifyAsync: jest.fn().mockResolvedValue({ sub: 'mock-user-id' }),
    })),
}));

// Mock Socket.IO
jest.mock('@nestjs/platform-socket.io', () => ({
    IoAdapter: jest.fn(),
}));

// Mock Winston
jest.mock('nest-winston', () => ({
    WinstonModule: {
        createLogger: jest.fn().mockReturnValue({
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        }),
    },
}));

export const createTestingModule = async (imports: any[] = []): Promise<TestingModule> => {
    return Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env.test',
            }),
            ...imports,
        ],
    }).compile();
};

export const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    zadd: jest.fn(),
    zrange: jest.fn(),
    zrangebyscore: jest.fn(),
    expire: jest.fn(),
    keys: jest.fn(),
    zcard: jest.fn(),
};

export const mockQueue = {
    add: jest.fn(),
    remove: jest.fn(),
    getJob: jest.fn(),
    getJobs: jest.fn(),
    clean: jest.fn(),
};

export const mockNatsClient = {
    publish: jest.fn(),
    subscribe: jest.fn(),
    request: jest.fn(),
    close: jest.fn(),
};

export const mockGrpcClient = {
    makeMove: jest.fn(),
    createGame: jest.fn(),
    resign: jest.fn(),
    findAccount: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    addToQueue: jest.fn(),
    acceptGame: jest.fn(),
    getRankings: jest.fn(),
};

// Test utilities
export const createMockUser = (overrides: any = {}) => ({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
    ...overrides,
});

export const createMockGame = (overrides: any = {}) => ({
    id: 'test-game-id',
    accountIds: { w: 'player1', b: 'player2' },
    gameType: 'rapid',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    seq: 1,
    ...overrides,
});

export const createMockMove = (overrides: any = {}) => ({
    from: 'e2',
    to: 'e4',
    piece: 'p',
    color: 'w',
    san: 'e4',
    flags: 'b',
    ...overrides,
});

// Clean up after each test
export const cleanupTestData = async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset Redis mock
    Object.values(mockRedis).forEach(mock => {
        if (typeof mock === 'function') {
            mock.mockClear();
        }
    });

    // Reset Queue mock
    Object.values(mockQueue).forEach(mock => {
        if (typeof mock === 'function') {
            mock.mockClear();
        }
    });

    // Reset NATS mock
    Object.values(mockNatsClient).forEach(mock => {
        if (typeof mock === 'function') {
            mock.mockClear();
        }
    });

    // Reset gRPC mock
    Object.values(mockGrpcClient).forEach(mock => {
        if (typeof mock === 'function') {
            mock.mockClear();
        }
    });
}; 
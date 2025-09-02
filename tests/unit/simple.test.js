// Simple test to verify Jest is working
describe('Jest Infrastructure Test', () => {
  it('should be able to run basic assertions', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have access to testing utilities', () => {
    expect(jest.fn).toBeDefined();
    expect(global.TextEncoder).toBeDefined();
    expect(global.TextDecoder).toBeDefined();
  });

  it('should be able to mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });
});
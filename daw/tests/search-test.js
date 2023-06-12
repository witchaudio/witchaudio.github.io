// Import the `fetch-mock` package
const fetchMock = require('fetch-mock');

// The module that you're testing
const { searchSamples } = require('daw/script.js');

afterEach(() => {
  fetchMock.restore();
});

test('searchSamples function', async () => {
  // Arrange
  const sampleData = {
    results: [
      { id: 1, name: "Sample 1", previews: { 'preview-lq-mp3': 'http://example.com/sample1.mp3' } },
      { id: 2, name: "Sample 2", previews: { 'preview-lq-mp3': 'http://example.com/sample2.mp3' } },
      // etc...
    ]
  };
  const searchInput = 'searchInput';
  fetchMock.getOnce(`https://freesound.org/apiv2/search/text/?query=${searchInput}&token=5LxMLSJFbXKWmsmtRgYXIaNprrIvk2HyZqK78T7e&fields=id,name,previews`, {
    body: sampleData,
    headers: { 'content-type': 'application/json' }
  });
  
  // Act
  const results = await searchSamples(searchInput);
  
  // Assert
  expect(results).toEqual(sampleData.results);
});

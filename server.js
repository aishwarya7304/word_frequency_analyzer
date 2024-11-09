const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
// Use environment variable for port or default to 3000
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function getWordFrequencies(text) {
    const cleanText = text.toLowerCase();
    const words = cleanText.match(/[a-zA-Z]+/g) || [];
    
    const frequencies = {};
    words.forEach(word => {
        if (word.length > 1) {
            frequencies[word] = (frequencies[word] || 0) + 1;
        }
    });
    
    return frequencies;
}

const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'is', 
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their'
]);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/analyze', async (req, res) => {
    try {
        const { url, n } = req.body;
        const numWords = parseInt(n) || 10;
        
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        $('script, style').remove();
        const text = $('body').text();
        
        const frequencies = getWordFrequencies(text);
        
        const sortedWords = Object.entries(frequencies)
            .filter(([word]) => !stopWords.has(word) && word.length > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, numWords)
            .map(([word, frequency]) => ({ word, frequency }));
        
        res.json({ words: sortedWords });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
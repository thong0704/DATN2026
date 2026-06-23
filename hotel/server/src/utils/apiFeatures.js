



class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    ['page', 'sort', 'limit', 'fields', 'search', 'q'].forEach((f) => delete queryObj[f]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|ne)\b/g, (m) => `$${m}`);
    const parsed = JSON.parse(queryStr);
    
    Object.keys(parsed).forEach((k) => {
      if (parsed[k] && typeof parsed[k] === 'object') {
        Object.keys(parsed[k]).forEach((op) => {
          if (op === '$in' && typeof parsed[k][op] === 'string') {
            parsed[k][op] = parsed[k][op].split(',');
          }
        });
      }
    });
    this.query = this.query.find(parsed);
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = Math.min(parseInt(this.queryString.limit, 10) || 12, 100);
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit, skip };
    return this;
  }
}

module.exports = APIFeatures;

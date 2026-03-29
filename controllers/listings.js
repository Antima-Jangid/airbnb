const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// 🔥 FIXED: Index with Search + Responsive Params
module.exports.index = async (req, res) => {
  try {
    // ✅ Get search params from query
    const { location, dates, guests, category, page = 1, limit = 12 } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Location search (title/description)
    if (location) {
      filter.$or = [
        { title: { $regex: location, $options: 'i' } },
        { description: { $regex: location, $options: 'i' } },
        { location: { $regex: location, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // ✅ Price filter (if guests/price range)
    if (guests) {
      filter.maxGroupSize = { $gte: parseInt(guests) || 1 };
    }
    
    // Fetch listings with pagination
    const allListings = await Listing.find(filter)
      .populate('owner')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    // ✅ Pass ALL variables to template (NO MORE ERRORS!)
    res.render("listings/index", { 
      allListings,
      title: 'All Listings',
      location: location || '',
      dates: dates || '',
      guests: guests || '',
      category: category || ''
    });
  } catch (err) {
    console.error('Index error:', err);
    req.flash('error', 'Server error! Try again.');
    res.redirect('/listings');
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new", { title: 'New Listing' });
};

module.exports.showListing = async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({ path: "reviews", populate: { path: "author" } })
      .populate("owner");
    
    if (!listing) {
      req.flash("error", "Listing you requested does not exist!");
      return res.redirect("/listings");
    }
    
    res.render("listings/show", { 
      listing, 
      title: listing.title,
      mapPopupMarkup: listing.mapPopupMarkup || ''
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Server error!");
    res.redirect("/listings");
  }
};

module.exports.createListing = async (req, res, next) => {
  try {
    let response = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();

    let url = req.file.path;
    let filename = req.file.filename;
    
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;
    newListing.mapPopupMarkup = newListing.mapPopupContent(newListing);
    
    let savedListing = await newListing.save();
    console.log('Created:', savedListing);
    req.flash("success", "New listing created!");
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error('Create error:', err);
    req.flash("error", "Cannot create listing!");
    res.redirect('/listings/new');
  }
};

module.exports.renderEditForm = async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing) {
      req.flash("error", "Listing does not exist!");
      return res.redirect("/listings");
    }
    
    if (!listing.owner.equals(req.user._id)) {
      req.flash("error", "You can only edit your listings!");
      return res.redirect(`/listings/${id}`);
    }
    
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    
    res.render("listings/edit", { 
      listing, 
      originalImageUrl,
      title: `Edit ${listing.title}`
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Server error!");
    res.redirect("/listings");
  }
};

module.exports.updateListing = async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    
    if (req.file) {
      listing.image = { 
        url: req.file.path, 
        filename: req.file.filename 
      };
    }
    
    listing.mapPopupMarkup = listing.mapPopupContent(listing);
    await listing.save();
    
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error('Update error:', err);
    req.flash("error", "Cannot update listing!");
    res.redirect(`/listings/${id}/edit`);
  }
};

module.exports.destroyListing = async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    
    if (!listing.owner.equals(req.user._id)) {
      req.flash("error", "You can only delete your listings!");
      return res.redirect(`/listings/${id}`);
    }
    
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
  } catch (err) {
    console.error(err);
    req.flash("error", "Server error!");
    res.redirect("/listings");
  }
};
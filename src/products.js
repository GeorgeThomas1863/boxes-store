import dbModel from "../models/db-model.js";

const generateSlug = (name, productId = '') => {
  const slug = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `product-${productId}`;
};

export const storeProduct = async (inputParams) => {
  const { route: _, ...params } = inputParams;

  const storeModel = new dbModel(params, process.env.PRODUCTS_COLLECTION);
  const storeData = await storeModel.storeAny();
  if (!storeData) return { success: false, message: "Failed to store product" };

  const newProductId = storeData.insertedId?.toString() || null;
  params.productId = newProductId;

  let slug = generateSlug(params.name, newProductId);
  let suffix = 2;
  while (true) {
    const slugCheckParams = { keyToLookup: 'urlName', itemValue: slug };
    const slugCheckModel = new dbModel(slugCheckParams, process.env.PRODUCTS_COLLECTION);
    const slugExists = await slugCheckModel.getUniqueItem();
    if (!slugExists) break;
    slug = generateSlug(params.name, newProductId) + '-' + suffix;
    suffix++;
  }
  params.urlName = slug;

  const updateParams = {
    keyToLookup: "_id",
    itemValue: storeData.insertedId,
    updateObj: params,
  };

  const updateModel = new dbModel(updateParams, process.env.PRODUCTS_COLLECTION);
  const updateData = await updateModel.updateObjItem();
  if (!updateData) return { success: false, message: "Failed to update product" };

  params.success = true;
  params.message = "Product added successfully";

  return params;
};

export const updateProduct = async (inputParams) => {
  const { route: _, ...params } = inputParams;

  const checkParams = {
    keyToLookup: "productId",
    itemValue: params.productId,
  };

  const checkModel = new dbModel(checkParams, process.env.PRODUCTS_COLLECTION);
  const checkData = await checkModel.getUniqueItem();
  if (!checkData) return { success: false, message: "Product not found" };

  if (!('urlName' in params) && !checkData.urlName) {
    const baseName = params.name || checkData.name;
    let slug = generateSlug(baseName, params.productId);
    let suffix = 2;
    while (true) {
      const slugCheckParams = { keyToLookup: 'urlName', itemValue: slug };
      const slugCheckModel = new dbModel(slugCheckParams, process.env.PRODUCTS_COLLECTION);
      const slugExists = await slugCheckModel.getUniqueItem();
      if (!slugExists) break;
      slug = generateSlug(baseName, params.productId) + '-' + suffix;
      suffix++;
    }
    params.urlName = slug;
  }

  if ('urlName' in params) {
    if (!params.urlName) {
      return { success: false, message: "URL Slug cannot be empty." };
    }
    const slugConflictParams = { keyToLookup: 'urlName', itemValue: params.urlName };
    const slugConflictModel = new dbModel(slugConflictParams, process.env.PRODUCTS_COLLECTION);
    const slugConflict = await slugConflictModel.getUniqueItem();
    if (slugConflict && slugConflict.productId !== params.productId) {
      return { success: false, message: "URL slug already taken. Please choose a different one." };
    }
  }

  const editParams = {
    keyToLookup: "productId",
    itemValue: params.productId,
    updateObj: params,
  };

  const editModel = new dbModel(editParams, process.env.PRODUCTS_COLLECTION);
  const editData = await editModel.updateObjItem();
  if (!editData) return { success: false, message: "Failed to update product" };

  params.success = true;
  params.message = "Product updated successfully";

  return params;
};

export const deleteProduct = async (productId) => {
  const checkParams = {
    keyToLookup: "productId",
    itemValue: productId,
  };

  const checkModel = new dbModel(checkParams, process.env.PRODUCTS_COLLECTION);
  const checkData = await checkModel.getUniqueItem();
  if (!checkData) return { success: false, message: "Product not found" };

  const params = {
    keyToLookup: "productId",
    itemValue: productId,
  };

  const deleteModel = new dbModel(params, process.env.PRODUCTS_COLLECTION);
  const deleteData = await deleteModel.deleteItem();
  if (!deleteData) return { success: false, message: "Failed to delete product" };

  return { success: true, message: "Product deleted successfully", productId };
};

export const getProductData = async () => {
  const dataModel = new dbModel("", process.env.PRODUCTS_COLLECTION);
  const data = await dataModel.getAll();
  return data;
};

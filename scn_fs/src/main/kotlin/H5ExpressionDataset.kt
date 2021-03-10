package ru.itmo.scn.fs

import ncsa.hdf.hdf5lib.H5
import ncsa.hdf.hdf5lib.HDF5Constants

class H5ExpressionDataset(h5path: String) {

    val openFileId = H5.H5Fopen(h5path, HDF5Constants.H5F_ACC_RDONLY, HDF5Constants.H5P_DEFAULT)
    val openGroup = H5.H5Gopen(openFileId, "X", HDF5Constants.H5P_DEFAULT)
    val groupInfo = H5.H5Gget_info(openGroup)

    val dataId = H5.H5Dopen(openGroup, "data", HDF5Constants.H5P_DEFAULT)
    val indicesId = H5.H5Dopen(openGroup, "indices", HDF5Constants.H5P_DEFAULT)
    val indPtrId = H5.H5Dopen(openGroup, "indptr", HDF5Constants.H5P_DEFAULT)

    val attrs = H5.H5Aget_num_attrs(openGroup)
    val attrNames = (0 until attrs).map {
        val aName = Array<String>(1) { "" }
        val attrId = H5.H5Aopen_by_idx(
            openGroup, ".", HDF5Constants.H5_INDEX_CRT_ORDER, HDF5Constants.H5_ITER_INC,
            it.toLong(), HDF5Constants.H5P_DEFAULT, HDF5Constants.H5P_DEFAULT
        )
        H5.H5Aget_name(attrId, aName)
        aName[0]
    }

    private val oldString = "h5sparse_shape"
    private val newString = "shape"
    val shapeString: String
        get() {
            if (attrNames.contains(newString)) return newString
            if (attrNames.contains(oldString)) return oldString
            return ""
        }

    val shapeId = H5.H5Aopen(openGroup, shapeString, HDF5Constants.H5P_DEFAULT)
    private var _shape: IntArray? = null
    val shape: IntArray
        get() {
            if (_shape == null) {
                _shape = IntArray(2)
                H5.H5Aread(shapeId, HDF5Constants.H5T_NATIVE_INT, _shape)
            }
            return _shape!!
        }

    val barcodes = shape[0]
    val features = shape[1]

    private fun <T> getSlice(datasetId: Int, start: Int, end: Int, result:T, type: Int) {
        val size = end - start + 1
        val filespaceId = H5.H5Dget_space(datasetId)
        val startArray = longArrayOf(start.toLong())
        val countArray = longArrayOf(size.toLong())
        val statusSlab =
            H5.H5Sselect_hyperslab(filespaceId, HDF5Constants.H5S_SELECT_SET, startArray, null, countArray, null)
        val memspace = H5.H5Screate_simple(1, countArray, null)
        val statusRead = H5.H5Dread(datasetId, type, memspace, filespaceId, HDF5Constants.H5P_DEFAULT, result)
        H5.H5Sclose(memspace)
        H5.H5Sclose(filespaceId)
    }


    private fun readIntSlice(datasetId: Int, start: Int, end: Int): IntArray {
        val size = end - start + 1
        val result = IntArray(size)
        getSlice(datasetId, start, end, result, HDF5Constants.H5T_NATIVE_INT)
        return result
    }

    private fun readFloatSlice(datasetId: Int, start: Int, end: Int): FloatArray {
        val size = end - start + 1
        val result = FloatArray(size)
        getSlice(datasetId, start, end, result, HDF5Constants.H5T_NATIVE_FLOAT)
        return result
    }

    fun getDataSlice(start: Int, end: Int): FloatArray {
        return readFloatSlice(dataId, start, end)
    }

    fun getIndicesSlice(start: Int, end: Int): IntArray {
        return readIntSlice(indicesId, start, end)
    }

    fun getIndPtrSlice(start: Int, end: Int): IntArray {
        return readIntSlice(indPtrId, start, end)
    }

    fun getFeatureByIndex(ind: Int): FloatArray {
        val indices = getIndPtrSlice(ind, ind+1)
        val start = indices[0]
        val end = indices[1]
        val values = getDataSlice(start, end - 1)
        val inds = getIndicesSlice(start, end - 1)
        val retVal = FloatArray(barcodes)
        for (i in values.indices) {
            retVal[inds[i]] = values[i]
        }
        return retVal
    }

    fun getFeaturesAverage(indices: List<Int>):FloatArray {
        var ans = FloatArray(barcodes)
        val setSize = indices.size.toFloat()

        ans.fill(0F)
        for (i in indices) {
            ans = ans.add(getFeatureByIndex(i).scale() / setSize)
        }
        return ans

    }

    companion object {
        private val openDatasets = HashMap<String, H5ExpressionDataset>()
        fun getDataset(h5path: String): H5ExpressionDataset {
            val dataset = openDatasets[h5path]
            return if (dataset == null) {
                val newDataset = H5ExpressionDataset(h5path)
                openDatasets[h5path] = newDataset
                newDataset
            } else {
                dataset
            }
        }
    }
}
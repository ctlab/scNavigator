import json
import bson
import numpy as np
import pandas as pd

FLOAT_REPR = lambda x: f'{x:.4g}'
INFINITY = float('inf')


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, pd.Series):
            return obj.to_dict()
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return np.bool(obj)
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, bson.objectid.ObjectId):
            return str(obj)
        return json.JSONEncoder.default(self, obj)

    def iterencode(self, o, _one_shot=False):
        """
        Below is modified copypaste from standard library json.JSONEncoder and also
        a terrible example of design

        all of this was done only to override "floatstr" function inside of "iterencode" method
        just to  use another float representation

        why on earth wouldn't you do this a proper class member, I don't know

        why floatstr takes so many arguments "faking" possibility to modify standard behaviour
        while on practice it is only used WITH ONE ARGUMENT

        """
        if self.check_circular:
            markers = {}
        else:
            markers = None
        if self.ensure_ascii:
            _encoder = json.encoder.encode_basestring_ascii
        else:
            _encoder = json.encoder.encode_basestring

        def floatstr(o, allow_nan=self.allow_nan,
                     _repr=FLOAT_REPR, _inf=INFINITY, _neginf=-INFINITY):
            # Check for specials.  Note that this type of test is processor
            # and/or platform-specific, so do tests which don't depend on the
            # internals.

            if o != o:
                text = 'NaN'
            elif o == _inf:
                text = 'Infinity'
            elif o == _neginf:
                text = '-Infinity'
            else:
                return _repr(o)

            if not allow_nan:
                raise ValueError(
                    "Out of range float values are not JSON compliant: " +
                    repr(o))

            return text

        if (_one_shot and json.encoder.c_make_encoder is not None
                and self.indent is None):
            _iterencode = json.encoder.c_make_encoder(
                markers, self.default, _encoder, self.indent,
                self.key_separator, self.item_separator, self.sort_keys,
                self.skipkeys, self.allow_nan)
        else:
            _iterencode = json.encoder._make_iterencode(
                markers, self.default, _encoder, self.indent, floatstr,
                self.key_separator, self.item_separator, self.sort_keys,
                self.skipkeys, _one_shot)
        return _iterencode(o, 0)

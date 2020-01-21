import os
import errno
import tempfile


def mkdir_with_check(dirname: str) -> None:
    try:
        os.mkdir(dirname)
    except OSError as exc:
        if exc.errno != errno.EEXIST:
            raise
        pass


def rm_rf(dirname: str) -> None:
    if os.path.exists(dirname):
        for path in os.listdir(dirname):
            full_path = os.path.join(dirname, path)
            if os.path.isdir(full_path):
                rm_rf(full_path)
            if os.path.isfile(full_path):
                os.remove(full_path)
            if os.path.islink(full_path):
                os.remove(full_path)
        os.rmdir(dirname)


# taken from https://stackoverflow.com/questions/55740417/atomic-ln-sf-in-python-symlink-overwriting-exsting-file
def symlink_force(target: str, link_name: str):
    """
    Create a symbolic link link_name pointing to target.
    Overwrites link_name if it exists.
    """

    # os.replace() may fail if files are on different filesystems
    link_dir = os.path.dirname(link_name)

    while True:
        temp_link_name = tempfile.mktemp(dir=link_dir)
        try:
            os.symlink(target, temp_link_name)
            break
        except FileExistsError:
            pass
    try:
        os.replace(temp_link_name, link_name)
    except OSError:  # e.g. permission denied
        os.remove(temp_link_name)
        raise
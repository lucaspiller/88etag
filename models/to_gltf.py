import bpy
import os

def convert_filepath(filename):
    # Ensure the filename contains 'models/'
    parts = filename.split(os.sep)
    if "models" not in parts:
        raise ValueError("Filename must contain 'models/'")
    
    # Extract the part after 'models/'
    models_index = parts.index("models")
    base_name = os.path.basename(filename)
    new_name = os.path.splitext(base_name)[0] + ".gltf"
    
    # Construct the new path
    new_path = os.path.join("public", "models", new_name)
    return new_path

output_file_path = convert_filepath(bpy.data.filepath)
bpy.ops.export_scene.gltf(filepath=output_file_path, export_format="GLB", export_yup=False)


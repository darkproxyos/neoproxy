import bpy
import math

# ============================================================
#  SPACE SCENE v2 - Compatible Blender 5.0
# ============================================================

# --- 1. LIMPIAR ESCENA ---
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# --- 2. RENDER ENGINE ---
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 128
bpy.context.preferences.addons['cycles'].preferences.compute_device_type = 'CUDA'
bpy.context.scene.cycles.device = 'GPU'

# --- 3. FONDO ESTRELLADO (World) ---
world = bpy.context.scene.world
world.use_nodes = True
nt = world.node_tree
nt.nodes.clear()

coord  = nt.nodes.new('ShaderNodeTexCoord')
noise  = nt.nodes.new('ShaderNodeTexNoise')
ramp   = nt.nodes.new('ShaderNodeValToRGB')
em     = nt.nodes.new('ShaderNodeEmission')
bg     = nt.nodes.new('ShaderNodeBackground')
mix    = nt.nodes.new('ShaderNodeMixShader')
out    = nt.nodes.new('ShaderNodeOutputWorld')

noise.inputs['Scale'].default_value    = 700.0
noise.inputs['Detail'].default_value   = 16.0
noise.inputs['Roughness'].default_value = 0.7

ramp.color_ramp.elements[0].position   = 0.93
ramp.color_ramp.elements[0].color      = (0, 0, 0, 1)
ramp.color_ramp.elements[1].position   = 1.0
ramp.color_ramp.elements[1].color      = (1, 1, 1, 1)

em.inputs['Color'].default_value       = (1, 1, 1, 1)
em.inputs['Strength'].default_value    = 4.0
bg.inputs['Color'].default_value       = (0.0, 0.0, 0.015, 1)
bg.inputs['Strength'].default_value    = 1.0

nt.links.new(coord.outputs['Generated'], noise.inputs['Vector'])
nt.links.new(noise.outputs['Fac'],       ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'],      mix.inputs['Fac'])
nt.links.new(bg.outputs['Background'],   mix.inputs[1])
nt.links.new(em.outputs['Emission'],     mix.inputs[2])
nt.links.new(mix.outputs['Shader'],      out.inputs['Surface'])

print("✅ Fondo estrellado creado")

# --- 4. PLANETA ---
bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=3.0, location=(0,0,0))
planet = bpy.context.active_object
planet.name = "Planet"
bpy.ops.object.shade_smooth()

mat_p = bpy.data.materials.new("PlanetMat")
mat_p.use_nodes = True
pn = mat_p.node_tree
pn.nodes.clear()

p_bsdf  = pn.nodes.new('ShaderNodeBsdfPrincipled')
p_noise = pn.nodes.new('ShaderNodeTexNoise')
p_ramp  = pn.nodes.new('ShaderNodeValToRGB')
p_bump  = pn.nodes.new('ShaderNodeBump')
p_out   = pn.nodes.new('ShaderNodeOutputMaterial')

p_noise.inputs['Scale'].default_value      = 4.0
p_noise.inputs['Detail'].default_value     = 12.0
p_noise.inputs['Roughness'].default_value  = 0.65
p_noise.inputs['Distortion'].default_value = 0.5

cr = p_ramp.color_ramp
cr.elements[0].color    = (0.03, 0.12, 0.5,  1)   # océano
cr.elements[0].position = 0.0
cr.elements.new(0.42)
cr.elements[1].color    = (0.05, 0.08, 0.35, 1)   # océano oscuro
cr.elements.new(0.48)
cr.elements[2].color    = (0.15, 0.40, 0.15, 1)   # tierra/verde
cr.elements.new(0.65)
cr.elements[3].color    = (0.45, 0.38, 0.22, 1)   # desierto
cr.elements[-1].position = 1.0
cr.elements[-1].color    = (0.85, 0.82, 0.78, 1)  # polar/nieve

p_bsdf.inputs['Roughness'].default_value = 0.6
p_bump.inputs['Strength'].default_value  = 0.25

pn.links.new(p_noise.outputs['Fac'],   p_ramp.inputs['Fac'])
pn.links.new(p_ramp.outputs['Color'],  p_bsdf.inputs['Base Color'])
pn.links.new(p_noise.outputs['Fac'],   p_bump.inputs['Height'])
pn.links.new(p_bump.outputs['Normal'], p_bsdf.inputs['Normal'])
pn.links.new(p_bsdf.outputs['BSDF'],   p_out.inputs['Surface'])
planet.data.materials.append(mat_p)

print("✅ Planeta creado")

# --- 5. ATMÓSFERA ---
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=3.15, location=(0,0,0))
atmo = bpy.context.active_object
atmo.name = "Atmosphere"
bpy.ops.object.shade_smooth()

mat_a = bpy.data.materials.new("AtmoMat")
mat_a.use_nodes = True
mat_a.blend_method = 'BLEND'
an = mat_a.node_tree
an.nodes.clear()

a_bsdf = an.nodes.new('ShaderNodeBsdfPrincipled')
a_out  = an.nodes.new('ShaderNodeOutputMaterial')

a_bsdf.inputs['Base Color'].default_value        = (0.15, 0.45, 1.0, 1)
a_bsdf.inputs['Alpha'].default_value             = 0.07
a_bsdf.inputs['Roughness'].default_value         = 0.0
a_bsdf.inputs['Transmission Weight'].default_value = 1.0

an.links.new(a_bsdf.outputs['BSDF'], a_out.inputs['Surface'])
atmo.data.materials.append(mat_a)

print("✅ Atmósfera creada")

# --- 6. ANILLOS ---
bpy.ops.mesh.primitive_torus_add(
    major_radius=5.5,
    minor_radius=1.2,
    major_segments=128,
    minor_segments=4,
    location=(0,0,0)
)
rings = bpy.context.active_object
rings.name = "Rings"
rings.scale.z = 0.025
bpy.ops.object.transform_apply(scale=True)

mat_r = bpy.data.materials.new("RingMat")
mat_r.use_nodes = True
mat_r.blend_method = 'BLEND'
rn = mat_r.node_tree
rn.nodes.clear()

r_bsdf  = rn.nodes.new('ShaderNodeBsdfPrincipled')
r_noise = rn.nodes.new('ShaderNodeTexNoise')
r_ramp  = rn.nodes.new('ShaderNodeValToRGB')
r_out   = rn.nodes.new('ShaderNodeOutputMaterial')

r_noise.inputs['Scale'].default_value = 50.0
r_noise.inputs['Detail'].default_value = 6.0

r_ramp.color_ramp.elements[0].color = (0.55, 0.42, 0.28, 1)
r_ramp.color_ramp.elements[1].color = (0.88, 0.72, 0.50, 1)

r_bsdf.inputs['Roughness'].default_value = 0.85
r_bsdf.inputs['Alpha'].default_value     = 0.55

rn.links.new(r_noise.outputs['Fac'], r_ramp.inputs['Fac'])
rn.links.new(r_ramp.outputs['Color'], r_bsdf.inputs['Base Color'])
rn.links.new(r_noise.outputs['Fac'], r_bsdf.inputs['Alpha'])
rn.links.new(r_bsdf.outputs['BSDF'], r_out.inputs['Surface'])
rings.data.materials.append(mat_r)

print("✅ Anillos creados")

# --- 7. LUNA ---
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=0.65, location=(9, 3, 2))
moon = bpy.context.active_object
moon.name = "Moon"
bpy.ops.object.shade_smooth()

mat_m = bpy.data.materials.new("MoonMat")
mat_m.use_nodes = True
mn = mat_m.node_tree
mn.nodes.clear()

m_bsdf  = mn.nodes.new('ShaderNodeBsdfPrincipled')
m_noise = mn.nodes.new('ShaderNodeTexNoise')
m_ramp  = mn.nodes.new('ShaderNodeValToRGB')
m_bump  = mn.nodes.new('ShaderNodeBump')
m_out   = mn.nodes.new('ShaderNodeOutputMaterial')

m_noise.inputs['Scale'].default_value     = 10.0
m_noise.inputs['Detail'].default_value    = 16.0
m_noise.inputs['Roughness'].default_value = 0.9

m_ramp.color_ramp.elements[0].color = (0.25, 0.25, 0.25, 1)
m_ramp.color_ramp.elements[1].color = (0.65, 0.65, 0.65, 1)

m_bsdf.inputs['Roughness'].default_value = 0.95
m_bump.inputs['Strength'].default_value  = 0.9

mn.links.new(m_noise.outputs['Fac'],   m_ramp.inputs['Fac'])
mn.links.new(m_ramp.outputs['Color'],  m_bsdf.inputs['Base Color'])
mn.links.new(m_noise.outputs['Fac'],   m_bump.inputs['Height'])
mn.links.new(m_bump.outputs['Normal'], m_bsdf.inputs['Normal'])
mn.links.new(m_bsdf.outputs['BSDF'],   m_out.inputs['Surface'])
moon.data.materials.append(mat_m)

print("✅ Luna creada")

# --- 8. LUZ SOLAR ---
bpy.ops.object.light_add(type='SUN', location=(20, -10, 15))
sun = bpy.context.active_object
sun.name = "Sun"
sun.data.energy = 8.0
sun.data.color  = (1.0, 0.95, 0.85)
sun.rotation_euler = (math.radians(45), 0, math.radians(30))

print("✅ Luz solar creada")

# --- 9. CÁMARA ---
bpy.ops.object.camera_add(location=(18, -14, 6))
cam = bpy.context.active_object
cam.name = "Camera"
cam.rotation_euler = (math.radians(80), 0, math.radians(52))
cam.data.lens = 50
bpy.context.scene.camera = cam

print("✅ Cámara creada")
print("")
print("🪐 ¡ESCENA ESPACIAL LISTA! Presiona F12 para renderizar.")
